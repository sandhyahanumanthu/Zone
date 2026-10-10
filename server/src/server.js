import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDB, closeDatabase } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('--- Initializing DropZone API Server ---');

  // Attempt database connection before starting traffic
  await connectDB();

  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`[DropZone API] Server listening on http://localhost:${PORT}`);
    console.log(`[DropZone API] Health check at http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal) => {
    console.log(`\n[DropZone API] Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      console.log('[DropZone API] HTTP server closed.');
      await closeDatabase();
      console.log('[DropZone API] Shutdown complete. Exiting.');
      process.exit(0);
    });

    // Force exit if hanging
    setTimeout(() => {
      console.error('[DropZone API] Forcefully terminating after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('[DropZone API] Fatal startup error:', err);
  process.exit(1);
});
