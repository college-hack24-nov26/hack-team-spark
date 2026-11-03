import 'dotenv/config';
import { createServer } from 'node:http';
import { connectDatabase } from './db.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 5000);
let database;
let server;
let shutdownPromise;

async function shutdown() {
  if (shutdownPromise) return shutdownPromise;
  shutdownPromise = (async () => {
    try {
      if (server?.listening) {
        await new Promise((resolve, reject) => {
          server.close(error => error ? reject(error) : resolve());
        });
      }
    } finally {
      await database?.close();
      console.log('[GREYZONE] MongoDB connection closed');
    }
  })();
  return shutdownPromise;
}

async function start() {
  try {
    database = await connectDatabase();
    console.log(`[GREYZONE] Connected to MongoDB database '${database.databaseName}'`);

    server = createServer(createApp(database));
    await new Promise((resolve, reject) => {
      const onError = error => reject(error);
      server.once('error', onError);
      server.once('listening', () => {
        server.removeListener('error', onError);
        resolve();
      });
      server.listen(port);
    });
    server.on('error', error => {
      console.error('[GREYZONE] HTTP server error', error);
      process.exitCode = 1;
      void shutdown().catch(shutdownError => console.error('[GREYZONE] Shutdown failed', shutdownError));
    });
    console.log(`[GREYZONE] API listening at http://localhost:${port}`);
  } catch (error) {
    console.error('[GREYZONE] Startup failed:', error.message);
    try { await shutdown(); } catch (shutdownError) {
      console.error('[GREYZONE] Shutdown failed:', shutdownError.message);
    }
    process.exitCode = 1;
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    shutdown().then(() => { process.exitCode = 0; }).catch(error => {
      console.error('[GREYZONE] Shutdown failed:', error.message);
      process.exitCode = 1;
    });
  });
}

await start();
