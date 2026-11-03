import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { z } from 'zod';
import { detect, scenarioTypes, severityFor } from './detection.js';

const sourceIpSchema = z.string().refine(value => isIP(value) !== 0, 'Invalid IP address');
const eventSchema = z.object({
  type: z.enum(scenarioTypes),
  sourceIp: sourceIpSchema,
  target: z.string().trim().min(1).max(120),
}).strict();
const scenarioSchema = z.object({
  scenario: z.enum(scenarioTypes),
  sourceIp: sourceIpSchema,
  target: z.string().trim().min(1).max(120),
}).strict();
const idSchema = z.string().uuid();
const timestamp = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString();

function sendEventValidationError(res, error) {
  const invalidIp = error.issues.some(issue => issue.path[0] === 'sourceIp');
  if (invalidIp) return res.status(400).json({ error: 'Invalid IP address' });
  return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
}

function publicDocument(document) {
  if (!document) return document;
  const { _id, ...fields } = document;
  return fields;
}

function createSourceLock() {
  const locks = new Map();
  return async function withSourceLock(sourceIp, operation) {
    const previous = locks.get(sourceIp) || Promise.resolve();
    let release;
    const current = new Promise(resolve => { release = resolve; });
    locks.set(sourceIp, current);
    await previous;
    try {
      return await operation();
    } finally {
      release();
      if (locks.get(sourceIp) === current) locks.delete(sourceIp);
    }
  };
}

export function createApp(db, detector = detect) {
  const app = express();
  const withSourceLock = createSourceLock();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use(cors({ origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',') }));
  app.use(express.json({ limit: '16kb' }));

  async function enrichIncident(incident) {
    if (!incident) return incident;
    const [actions, alerts] = await Promise.all([
      db.actions.find({ incident_id: incident.id }).sort({ created_at: 1, id: 1 }).toArray(),
      db.alerts.find({ incident_id: incident.id }).sort({ created_at: 1, id: 1 }).toArray(),
    ]);
    return {
      ...publicDocument(incident),
      actions: actions.map(publicDocument),
      alerts: alerts.map(alert => ({ ...publicDocument(alert), acknowledged: Boolean(alert.acknowledged) })),
    };
  }

  async function compensateIncident({ id, sourceIp, previousBlock, incidentCreated, blockWriteAttempted }) {
    const failures = [];
    const clean = async operation => {
      try { await operation(); } catch (error) { failures.push(error); }
    };

    await clean(() => db.alerts.deleteMany({ incident_id: id }));
    await clean(() => db.actions.deleteMany({ incident_id: id }));
    if (blockWriteAttempted) {
      if (previousBlock) {
        await clean(() => db.blockedSources.replaceOne(
          { _id: sourceIp, incident_id: id }, previousBlock,
        ));
      } else {
        await clean(() => db.blockedSources.deleteOne({ _id: sourceIp, incident_id: id }));
      }
    }
    if (incidentCreated) await clean(() => db.incidents.deleteOne({ id }));
    return failures;
  }

  async function persistEvent(event, finding) {
    const id = randomUUID();
    const now = timestamp();
    const severity = severityFor(finding.score);
    const threatened = finding.score >= 60;
    const incident = {
      id,
      event_type: event.type,
      source_ip: event.sourceIp,
      target: event.target,
      severity,
      score: finding.score,
      reason: finding.reason,
      status: threatened ? 'processing' : 'safe',
      created_at: now,
      updated_at: now,
    };

    return withSourceLock(event.sourceIp, async () => {
      const previousBlock = threatened
        ? await db.blockedSources.findOne({ _id: event.sourceIp })
        : null;
      let incidentCreated = false;
      let blockWriteAttempted = false;

      try {
        await db.incidents.insertOne({ _id: id, ...incident });
        incidentCreated = true;

        if (threatened) {
          blockWriteAttempted = true;
          await db.blockedSources.updateOne(
            { _id: event.sourceIp },
            { $set: { source_ip: event.sourceIp, incident_id: id, created_at: now } },
            { upsert: true },
          );

          const verified = await db.blockedSources.findOne({
            _id: event.sourceIp,
            source_ip: event.sourceIp,
            incident_id: id,
          });
          if (!verified) {
            const error = new Error('Containment verification failed');
            error.status = 503;
            throw error;
          }

          const actionTime = timestamp();
          const blockActionId = randomUUID();
          await db.actions.insertOne({
            _id: blockActionId,
            id: blockActionId,
            incident_id: id,
            action_type: 'simulate_block_ip',
            status: 'success',
            details: `Simulation: ${event.sourceIp} added to virtual blocklist`,
            created_at: actionTime,
          });

          const verifyActionId = randomUUID();
          await db.actions.insertOne({
            _id: verifyActionId,
            id: verifyActionId,
            incident_id: id,
            action_type: 'verify_containment',
            status: 'success',
            details: 'Verified in virtual blocklist',
            created_at: timestamp(1),
          });
          const alertId = randomUUID();
          await db.alerts.insertOne({
            _id: alertId,
            id: alertId,
            incident_id: id,
            message: `${severity.toUpperCase()} threat: ${event.type} from ${event.sourceIp}`,
            severity,
            acknowledged: false,
            created_at: timestamp(2),
          });

          const finalized = await db.incidents.updateOne(
            { id },
            { $set: { status: 'contained', updated_at: timestamp() } },
          );
          if (finalized.matchedCount !== 1) {
            throw new Error('Incident finalization failed');
          }
        }

        const createdIncident = await db.incidents.findOne({ id, _id: id });
        if (!createdIncident || (threatened && createdIncident.status !== 'contained')) {
          throw new Error('Incident persistence verification failed');
        }
        return await enrichIncident(createdIncident);
      } catch (error) {
        const cleanupFailures = await compensateIncident({
          id, sourceIp: event.sourceIp, previousBlock, incidentCreated, blockWriteAttempted,
        });
        if (cleanupFailures.length) {
          console.error('[GREYZONE] MongoDB workflow compensation was incomplete', new AggregateError(cleanupFailures));
        }
        throw error;
      }
    });
  }

  async function processEvent(event) {
    let finding;
    try {
      finding = await detector(event);
    } catch (cause) {
      const error = new Error('Detection service error', { cause });
      error.status = 502;
      throw error;
    }
    if (!finding || !Number.isInteger(finding.score) || finding.score < 0 || finding.score > 100 || typeof finding.reason !== 'string' || finding.reason.length > 500) {
      const error = new Error('Invalid detection result');
      error.status = 502;
      throw error;
    }
    return persistEvent(event, finding);
  }

  const asyncRoute = fn => (req, res, next) => Promise.resolve().then(() => fn(req, res)).catch(next);

  app.get('/api/health', (_req, res) => res.json({
    status: 'ok',
    service: 'greyzone-backend',
    mode: process.env.DETECTION_URL ? 'external-detection' : 'demo-detection',
  }));

  app.post('/api/events', asyncRoute(async (req, res) => {
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) return sendEventValidationError(res, parsed.error);
    res.status(201).json({ incident: await processEvent(parsed.data) });
  }));

  app.post('/api/scenarios', asyncRoute(async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.scenario !== 'string' || !scenarioTypes.includes(body.scenario)) {
      return res.status(400).json({ error: 'Unsupported scenario' });
    }
    const parsed = scenarioSchema.safeParse(body);
    if (!parsed.success) return sendEventValidationError(res, parsed.error);
    const { scenario, sourceIp, target } = parsed.data;
    res.status(201).json({ incident: await processEvent({ type: scenario, sourceIp, target }) });
  }));

  app.get('/api/incidents', asyncRoute(async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit || '25'), 10) || 25, 1), 100);
    const incidents = await db.incidents.find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1, id: -1 }).limit(limit).toArray();
    res.json({ incidents });
  }));

  app.get('/api/incidents/:id', asyncRoute(async (req, res) => {
    if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'Invalid incident ID' });
    const incident = await db.incidents.findOne({ id: req.params.id });
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ incident: await enrichIncident(incident) });
  }));

  app.get('/api/alerts', asyncRoute(async (_req, res) => {
    const alerts = await db.alerts.find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1, id: -1 }).limit(100).toArray();
    res.json({ alerts: alerts.map(alert => ({ ...alert, acknowledged: Boolean(alert.acknowledged) })) });
  }));

  app.patch('/api/alerts/:id/acknowledge', asyncRoute(async (req, res) => {
    if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: 'Invalid alert ID' });
    const result = await db.alerts.updateOne({ id: req.params.id }, { $set: { acknowledged: true } });
    if (!result.matchedCount) return res.status(404).json({ error: 'Alert not found' });
    res.json({ success: true });
  }));

  app.get('/api/status', asyncRoute(async (_req, res) => {
    const [totalIncidents, containedIncidents, failedIncidents, activeAlerts, totalAlerts, blockedSources] = await Promise.all([
      db.incidents.countDocuments({}),
      db.incidents.countDocuments({ status: 'contained' }),
      db.incidents.countDocuments({ status: 'failed' }),
      db.alerts.countDocuments({ acknowledged: false }),
      db.alerts.countDocuments({}),
      db.blockedSources.countDocuments({}),
    ]);
    const activeThreats = containedIncidents + failedIncidents;
    res.json({
      status: 'operational',
      service: 'greyzone-backend',
      statistics: { totalIncidents, activeThreats, blockedSources, totalAlerts },
      totalIncidents,
      containedIncidents,
      failedIncidents,
      activeAlerts,
      blockedSources,
      networkStatus: failedIncidents ? 'attention_required' : activeAlerts ? 'threats_contained' : 'normal',
      simulation: true,
    });
  }));

  app.get('/api/blocked-sources', asyncRoute(async (_req, res) => {
    const rows = await db.blockedSources.find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1, source_ip: 1 }).toArray();
    res.json({
      blockedSources: rows.map(row => ({ ip: row.source_ip, status: 'blocked' })),
      sources: rows,
      simulation: true,
    });
  }));

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use((error, _req, res, _next) => {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: error.flatten() });
    if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ error: 'Invalid JSON' });
    const mongoUnavailable = ['MongoNetworkError', 'MongoServerSelectionError', 'MongoTopologyClosedError'].includes(error.name);
    const status = error.status || (mongoUnavailable ? 503 : error.message?.includes('Detection engine') ? 502 : 500);
    console.error('[GREYZONE]', error);
    const message = status === 502 ? 'Detection service error' : status === 503 ? 'Database service unavailable' : 'Internal server error';
    res.status(status).json({ error: message });
  });

  return app;
}
