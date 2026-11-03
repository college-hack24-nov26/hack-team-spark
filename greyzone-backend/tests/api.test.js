import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/db.js';
import { demoDetect } from '../src/detection.js';

const TEST_DATABASE_PREFIX = 'greyzone_test_';
const sequence = [
  { scenario: 'ddos', sourceIp: '10.10.10.53', target: 'demo-web', score: 95, severity: 'critical', status: 'contained' },
  { scenario: 'suspicious_login', sourceIp: '10.10.10.54', target: 'admin-panel', score: 65, severity: 'medium', status: 'contained' },
  { scenario: 'malware_beacon', sourceIp: '10.10.10.55', target: 'demo-endpoint', score: 90, severity: 'critical', status: 'contained' },
  { scenario: 'normal_traffic', sourceIp: '192.0.2.100', target: 'demo-server', score: 5, severity: 'low', status: 'safe' },
  { scenario: 'brute_force', sourceIp: '10.10.10.56', target: 'demo-login', score: 85, severity: 'high', status: 'contained' },
  { scenario: 'port_scan', sourceIp: '10.10.10.57', target: 'demo-server', score: 75, severity: 'high', status: 'contained' },
];

function newTestDatabaseName() {
  return `${TEST_DATABASE_PREFIX}${randomUUID().replaceAll('-', '')}`;
}

function assertJson(response, status) {
  assert.equal(response.status, status);
  assert.match(response.headers.get('content-type') || '', /application\/json/i);
  assert.equal(response.headers.get('cache-control'), 'no-store');
}

async function startApi(database, detector = demoDetect) {
  const server = createApp(database, detector).listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

async function stopApi(server) {
  if (!server?.listening) return;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

async function cleanupTestDatabase(database, databaseName) {
  if (!database) return;
  if (!databaseName.startsWith(TEST_DATABASE_PREFIX) || databaseName === 'greyzone') {
    throw new Error(`Refusing to drop a non-test database: ${databaseName}`);
  }
  try {
    await database.database.dropDatabase();
  } finally {
    await database.close();
  }
}

function postJson(base, path, body) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('MongoDB API integration: sequence, validation, persistence and all GET routes', async t => {
  const databaseName = newTestDatabaseName();
  assert.notEqual(databaseName, 'greyzone');
  const database = await connectDatabase({ dbName: databaseName });
  let server;
  try {
    ({ server } = await startApi(database));
    const base = `http://127.0.0.1:${server.address().port}`;
    const get = path => fetch(`${base}${path}`);

    await t.test('health reports the connected demo service', async () => {
      const response = await get('/api/health');
      assertJson(response, 200);
      assert.deepEqual(await response.json(), {
        status: 'ok', service: 'greyzone-backend', mode: 'demo-detection',
      });
    });

    await t.test('rejects invalid IPs and unsupported scenarios without writing incidents', async () => {
      for (const sourceIp of ['999.999.999.999', 'invalid-ip']) {
        const response = await postJson(base, '/api/scenarios', {
          scenario: 'ddos', sourceIp, target: 'validation-target',
        });
        assertJson(response, 400);
        assert.deepEqual(await response.json(), { error: 'Invalid IP address' });
      }
      const unsupported = await postJson(base, '/api/scenarios', {
        scenario: 'sql_injection', sourceIp: '198.51.100.50', target: 'validation-target',
      });
      assertJson(unsupported, 400);
      assert.deepEqual(await unsupported.json(), { error: 'Unsupported scenario' });
      assert.equal(await database.incidents.countDocuments({}), 0);
    });

    const created = [];
    await t.test('processes the required six scenarios sequentially with independent responses', async () => {
      for (const expected of sequence) {
        const response = await postJson(base, '/api/scenarios', {
          scenario: expected.scenario,
          sourceIp: expected.sourceIp,
          target: expected.target,
        });
        assertJson(response, 201);
        const { incident } = await response.json();
        assert.equal(incident.event_type, expected.scenario);
        assert.equal(incident.source_ip, expected.sourceIp);
        assert.equal(incident.target, expected.target);
        assert.equal(incident.score, expected.score);
        assert.equal(incident.severity, expected.severity);
        assert.equal(incident.status, expected.status);
        assert.match(incident.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

        if (expected.status === 'contained') {
          assert.equal(incident.actions.length, 2);
          assert.deepEqual(incident.actions.map(action => action.action_type).sort(), [
            'simulate_block_ip', 'verify_containment',
          ]);
          assert.ok(incident.actions.every(action => action.status === 'success'));
          assert.equal(incident.alerts.length, 1);
          assert.equal(incident.alerts[0].acknowledged, false);
          assert.ok(incident.actions.every(action => action.incident_id === incident.id));
          assert.ok(incident.alerts.every(alert => alert.incident_id === incident.id));
          assert.ok(incident.actions.every(action => action.id));
          assert.ok(incident.alerts[0].id);

          const block = await database.blockedSources.findOne({ _id: expected.sourceIp });
          assert.equal(block.incident_id, incident.id);
        } else {
          assert.equal(incident.actions.length, 0);
          assert.equal(incident.alerts.length, 0);
        }

        const storedIncident = await database.incidents.findOne({ id: incident.id, _id: incident.id });
        assert.ok(storedIncident);
        assert.equal(storedIncident.event_type, expected.scenario);
        assert.equal(storedIncident.source_ip, expected.sourceIp);
        assert.equal(storedIncident.target, expected.target);
        assert.equal(storedIncident.score, expected.score);
        assert.equal(storedIncident.severity, expected.severity);
        assert.equal(storedIncident.status, expected.status);
        assert.equal(await database.actions.countDocuments({ incident_id: incident.id }), expected.status === 'contained' ? 2 : 0);
        assert.equal(await database.alerts.countDocuments({ incident_id: incident.id }), expected.status === 'contained' ? 1 : 0);
        created.push(incident);
      }
      assert.equal(new Set(created.map(incident => incident.id)).size, sequence.length);
    });

    let eventEndpointIncident;
    await t.test('POST /api/events remains available and keeps normal traffic safe', async () => {
      const response = await postJson(base, '/api/events', {
        type: 'normal_traffic', sourceIp: '10.10.10.70', target: 'event-endpoint',
      });
      assertJson(response, 201);
      eventEndpointIncident = (await response.json()).incident;
      assert.equal(eventEndpointIncident.event_type, 'normal_traffic');
      assert.equal(eventEndpointIncident.status, 'safe');
      assert.equal(eventEndpointIncident.score, 5);
      assert.deepEqual(eventEndpointIncident.actions, []);
      assert.deepEqual(eventEndpointIncident.alerts, []);
    });

    await t.test('GET incidents and exact-ID retrieval return their own documents', async () => {
      const response = await get('/api/incidents?limit=100');
      assertJson(response, 200);
      const body = await response.json();
      assert.deepEqual(Object.keys(body), ['incidents']);
      assert.equal(body.incidents.length, 7);
      assert.equal(new Set(body.incidents.map(incident => incident.id)).size, 7);
      assert.ok(body.incidents.every(incident => !('_id' in incident)));

      const requested = created[2];
      const detailResponse = await get(`/api/incidents/${requested.id}`);
      assertJson(detailResponse, 200);
      assert.deepEqual((await detailResponse.json()).incident, requested);

      const invalidId = await get('/api/incidents/not-a-uuid');
      assertJson(invalidId, 400);
      assert.deepEqual(await invalidId.json(), { error: 'Invalid incident ID' });
    });

    await t.test('GET alerts, blocked sources and status have distinct database-backed structures', async () => {
      const alertsResponse = await get('/api/alerts');
      assertJson(alertsResponse, 200);
      const alertBody = await alertsResponse.json();
      assert.deepEqual(Object.keys(alertBody), ['alerts']);
      assert.equal(alertBody.alerts.length, 5);
      assert.equal(new Set(alertBody.alerts.map(alert => alert.id)).size, 5);
      assert.ok(alertBody.alerts.every(alert => alert.acknowledged === false));
      assert.equal(new Set(alertBody.alerts.map(alert => alert.incident_id)).size, 5);

      const blockedResponse = await get('/api/blocked-sources');
      assertJson(blockedResponse, 200);
      const blockedBody = await blockedResponse.json();
      assert.ok(Array.isArray(blockedBody.blockedSources));
      assert.equal(blockedBody.blockedSources.length, 5);
      assert.deepEqual(
        new Set(blockedBody.blockedSources.map(source => source.ip)),
        new Set(sequence.filter(item => item.status === 'contained').map(item => item.sourceIp)),
      );
      assert.ok(blockedBody.blockedSources.every(source => source.status === 'blocked'));
      assert.equal(blockedBody.sources.length, 5);

      const statusResponse = await get('/api/status');
      assertJson(statusResponse, 200);
      const status = await statusResponse.json();
      assert.equal(status.status, 'operational');
      assert.equal(status.service, 'greyzone-backend');
      assert.deepEqual(status.statistics, {
        totalIncidents: 7,
        activeThreats: 5,
        blockedSources: 5,
        totalAlerts: 5,
      });
      assert.equal(status.activeAlerts, 5);
    });

    await t.test('alert acknowledgement persists a Boolean and updates active-alert counts', async () => {
      const alert = created[0].alerts[0];
      const response = await fetch(`${base}/api/alerts/${alert.id}/acknowledge`, { method: 'PATCH' });
      assertJson(response, 200);
      assert.deepEqual(await response.json(), { success: true });
      const storedAlert = await database.alerts.findOne({ id: alert.id });
      assert.equal(storedAlert.acknowledged, true);
      assert.equal(typeof storedAlert.acknowledged, 'boolean');
      const statusResponse = await get('/api/status');
      assertJson(statusResponse, 200);
      assert.equal((await statusResponse.json()).activeAlerts, 4);
    });

    await t.test('MongoDB has the required uniqueness and lookup indexes', async () => {
      const actionIndexes = await database.actions.listIndexes().toArray();
      const alertIndexes = await database.alerts.listIndexes().toArray();
      const blockIndexes = await database.blockedSources.listIndexes().toArray();
      assert.ok(actionIndexes.some(index => index.unique && index.key.incident_id === 1 && index.key.action_type === 1));
      assert.ok(alertIndexes.some(index => index.unique && index.key.incident_id === 1));
      assert.ok(blockIndexes.some(index => index.unique && index.key.source_ip === 1));
    });

    await t.test('concurrent requests receive distinct, correctly associated responses', async () => {
      const concurrentScenarios = [
        { scenario: 'ddos', sourceIp: '10.30.0.10', target: 'concurrent-ddos' },
        { scenario: 'suspicious_login', sourceIp: '10.30.0.10', target: 'concurrent-login' },
        { scenario: 'malware_beacon', sourceIp: '10.30.0.12', target: 'concurrent-endpoint' },
        { scenario: 'normal_traffic', sourceIp: '192.0.2.210', target: 'concurrent-normal' },
        { scenario: 'brute_force', sourceIp: '10.30.0.14', target: 'concurrent-auth' },
        { scenario: 'port_scan', sourceIp: '10.30.0.15', target: 'concurrent-network' },
      ];
      const responses = await Promise.all(concurrentScenarios.map(item => postJson(base, '/api/scenarios', item)));
      const incidents = [];
      for (let index = 0; index < responses.length; index++) {
        assertJson(responses[index], 201);
        const incident = (await responses[index].json()).incident;
        const request = concurrentScenarios[index];
        assert.equal(incident.event_type, request.scenario);
        assert.equal(incident.source_ip, request.sourceIp);
        assert.equal(incident.target, request.target);
        incidents.push(incident);
      }
      assert.equal(new Set(incidents.map(incident => incident.id)).size, concurrentScenarios.length);
      for (const incident of incidents) {
        const persisted = await database.incidents.findOne({ id: incident.id });
        assert.equal(persisted.source_ip, incident.source_ip);
        assert.equal(persisted.event_type, incident.event_type);
        assert.equal(persisted.target, incident.target);
        assert.equal(await database.actions.countDocuments({ incident_id: incident.id }), incident.actions.length);
        assert.equal(await database.alerts.countDocuments({ incident_id: incident.id }), incident.alerts.length);
      }
      const maliciousActionIds = incidents.flatMap(incident => incident.actions.map(action => action.id));
      const maliciousAlertIds = incidents.flatMap(incident => incident.alerts.map(alert => alert.id));
      assert.equal(new Set(maliciousActionIds).size, maliciousActionIds.length);
      assert.equal(new Set(maliciousAlertIds).size, maliciousAlertIds.length);
    });

    await t.test('unknown routes still return the existing JSON 404', async () => {
      const response = await get('/api/not-a-route');
      assertJson(response, 404);
      assert.deepEqual(await response.json(), { error: 'Route not found' });
    });
  } finally {
    try { await stopApi(server); }
    finally { await cleanupTestDatabase(database, databaseName); }
  }
});

test('MongoDB data persists after reconnecting and detection failures do not write incidents', async t => {
  const databaseName = newTestDatabaseName();
  let database = await connectDatabase({ dbName: databaseName });
  let server;
  let incidentId;
  try {
    ({ server } = await startApi(database));
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await postJson(base, '/api/scenarios', {
      scenario: 'brute_force', sourceIp: '203.0.113.20', target: 'persistence-check',
    });
    assertJson(response, 201);
    incidentId = (await response.json()).incident.id;
    await stopApi(server);
    server = undefined;
    await database.close();

    database = await connectDatabase({ dbName: databaseName });
    const persisted = await database.incidents.findOne({ id: incidentId, _id: incidentId });
    assert.ok(persisted);
    assert.equal(persisted.score, 85);
    assert.equal(persisted.status, 'contained');
    assert.equal(await database.actions.countDocuments({ incident_id: incidentId }), 2);
    assert.equal(await database.alerts.countDocuments({ incident_id: incidentId }), 1);
    assert.equal((await database.blockedSources.findOne({ _id: '203.0.113.20' })).incident_id, incidentId);

    await t.test('a failing detector returns 502 without persisting an incident', async () => {
      const before = await database.incidents.countDocuments({});
      ({ server } = await startApi(database, async () => { throw new Error('detector unavailable'); }));
      const failureResponse = await postJson(`http://127.0.0.1:${server.address().port}`, '/api/scenarios', {
        scenario: 'ddos', sourceIp: '203.0.113.21', target: 'detector-failure',
      });
      assertJson(failureResponse, 502);
      assert.deepEqual(await failureResponse.json(), { error: 'Detection service error' });
      assert.equal(await database.incidents.countDocuments({}), before);
      await stopApi(server);
      server = undefined;
    });
  } finally {
    try { await stopApi(server); }
    finally { await cleanupTestDatabase(database, databaseName); }
  }
});

test('failed containment writes are compensated and never return a successful incident', async () => {
  const databaseName = newTestDatabaseName();
  const database = await connectDatabase({ dbName: databaseName });
  const failingBlocklist = new Proxy(database.blockedSources, {
    get(target, property) {
      if (property === 'updateOne') return async () => { throw new Error('simulated blocklist write failure'); };
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
  const failingStore = { ...database, blockedSources: failingBlocklist };
  let server;
  try {
    ({ server } = await startApi(failingStore));
    const response = await postJson(`http://127.0.0.1:${server.address().port}`, '/api/scenarios', {
      scenario: 'ddos', sourceIp: '203.0.113.22', target: 'containment-failure',
    });
    assertJson(response, 500);
    assert.deepEqual(await response.json(), { error: 'Internal server error' });
    assert.equal(await database.incidents.countDocuments({}), 0);
    assert.equal(await database.actions.countDocuments({}), 0);
    assert.equal(await database.alerts.countDocuments({}), 0);
    assert.equal(await database.blockedSources.countDocuments({}), 0);
  } finally {
    try { await stopApi(server); }
    finally { await cleanupTestDatabase(database, databaseName); }
  }
});
