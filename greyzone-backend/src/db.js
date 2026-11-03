import { MongoClient } from 'mongodb';

const defaultUri = 'mongodb://127.0.0.1:27017';
const defaultDatabaseName = 'greyzone';
const collectionNames = ['incidents', 'actions', 'alerts', 'blocked_sources'];

async function ensureCollections(database) {
  const existing = new Set(
    (await database.listCollections({}, { nameOnly: true }).toArray()).map(collection => collection.name),
  );
  for (const name of collectionNames) {
    if (!existing.has(name)) {
      try {
        await database.createCollection(name);
      } catch (error) {
        // Another server process may create a collection after listCollections.
        if (error.code !== 48) throw error;
      }
    }
  }
}

async function ensureIndexes({ incidents, actions, alerts, blockedSources }) {
  await Promise.all([
    incidents.createIndex({ id: 1 }, { unique: true, name: 'incident_id_unique' }),
    incidents.createIndex({ created_at: -1, id: -1 }, { name: 'incident_created_at_desc' }),
    actions.createIndex({ id: 1 }, { unique: true, name: 'action_id_unique' }),
    actions.createIndex({ incident_id: 1, action_type: 1 }, { unique: true, name: 'incident_action_unique' }),
    actions.createIndex({ incident_id: 1 }, { name: 'action_incident_id' }),
    alerts.createIndex({ id: 1 }, { unique: true, name: 'alert_id_unique' }),
    alerts.createIndex({ incident_id: 1 }, { unique: true, name: 'alert_incident_unique' }),
    alerts.createIndex({ created_at: -1, id: -1 }, { name: 'alert_created_at_desc' }),
    blockedSources.createIndex({ source_ip: 1 }, { unique: true, name: 'blocked_source_ip_unique' }),
    blockedSources.createIndex({ incident_id: 1 }, { name: 'blocked_source_incident_id' }),
    blockedSources.createIndex({ created_at: -1 }, { name: 'blocked_source_created_at_desc' }),
  ]);
}

/** Connect to MongoDB, initialize GREYZONE collections and indexes, and return the shared store. */
export async function connectDatabase({
  uri = process.env.MONGODB_URI || defaultUri,
  dbName = process.env.MONGODB_DB_NAME || defaultDatabaseName,
  serverSelectionTimeoutMS = 5000,
} = {}) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS });
  try {
    await client.connect();
    const database = client.db(dbName);
    await database.command({ ping: 1 });
    await ensureCollections(database);

    const store = {
      client,
      database,
      databaseName: dbName,
      incidents: database.collection('incidents'),
      actions: database.collection('actions'),
      alerts: database.collection('alerts'),
      blockedSources: database.collection('blocked_sources'),
      close: () => client.close(),
    };
    await ensureIndexes(store);
    return store;
  } catch (cause) {
    await client.close().catch(() => {});
    const error = new Error(`MongoDB connection or initialization failed: ${cause.message}`, { cause });
    error.code = cause.code;
    throw error;
  }
}
