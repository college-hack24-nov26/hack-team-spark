// ---------------------------------------------------------------------------
// API layer. Components only ever call `api.*`, so switching from the mock to
// the real Express backend is one env var:  VITE_USE_MOCK=false npm run dev
//
// Contract (agree this with Members 2, 3 and 4):
//   GET  /api/network          -> { nodes:[{id,label,status}], edges:[{id,source,target,state}] }
//        status: healthy | suspicious | isolated | at_risk      state: active | blocked
//   GET  /api/incidents        -> [{ id, time, threat, node, action, severity, verified, reachable:[ids] }]
//   POST /api/simulate/attack  -> body { target, type, leaveBackdoor }   (returns {ok:true})
//   POST /api/reset            -> {ok:true}
// ---------------------------------------------------------------------------

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

async function http(path, opts = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

const real = {
  getNetwork: () => http('/network'),
  getIncidents: () => http('/incidents'),
  attack: (body) => http('/simulate/attack', { method: 'POST', body: JSON.stringify(body) }),
  reset: () => http('/reset', { method: 'POST' }),
};

// ------------------------------ Mock engine --------------------------------
const fresh = () => ({
  nodes: [
    { id: 'bunker1', label: 'Bunker 1', status: 'healthy' },
    { id: 'bunker2', label: 'Bunker 2', status: 'healthy' },
    { id: 'bunker3', label: 'Bunker 3', status: 'healthy' },
  ],
  edges: [
    { id: 'e12', source: 'bunker1', target: 'bunker2', state: 'active' },
    { id: 'e13', source: 'bunker1', target: 'bunker3', state: 'active' },
    { id: 'e23', source: 'bunker2', target: 'bunker3', state: 'active' },
  ],
  incidents: [],
});
let db = fresh();

const THREATS = {
  traffic_flood: 'Malicious traffic flood',
  failed_logins: 'Repeated failed logins',
};

function reachableFrom(start) {
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    for (const e of db.edges) {
      if (e.state !== 'active') continue;
      const next = e.source === cur ? e.target : e.target === cur ? e.source : null;
      if (next && !seen.has(next)) { seen.add(next); queue.push(next); }
    }
  }
  seen.delete(start);
  return [...seen];
}

const mock = {
  getNetwork: async () => structuredClone({ nodes: db.nodes, edges: db.edges }),
  getIncidents: async () => structuredClone(db.incidents),
  reset: async () => { db = fresh(); return { ok: true }; },
  attack: async ({ target, type, leaveBackdoor }) => {
    const node = db.nodes.find((n) => n.id === target);
    if (!node || node.status !== 'healthy') return { ok: false };
    node.status = 'suspicious';

    setTimeout(() => {
      // Response rule: block every link touching the target. With
      // leaveBackdoor, one link is "misconfigured" so verification fails.
      let skipped = false;
      db.edges.forEach((e) => {
        if (e.source !== target && e.target !== target) return;
        if (leaveBackdoor && !skipped) { skipped = true; return; }
        e.state = 'blocked';
      });
      node.status = 'isolated';

      const reachable = reachableFrom(target);
      reachable.forEach((id) => { db.nodes.find((n) => n.id === id).status = 'at_risk'; });

      db.incidents.unshift({
        id: Date.now(),
        time: new Date().toISOString(),
        threat: THREATS[type] ?? type,
        node: target,
        action: `Isolated ${node.label}: blocked its connections`,
        severity: 'high',
        verified: reachable.length === 0,
        reachable,
      });
    }, 1500);
    return { ok: true };
  },
};

export const api = USE_MOCK ? mock : real;
export const THREAT_TYPES = THREATS;
