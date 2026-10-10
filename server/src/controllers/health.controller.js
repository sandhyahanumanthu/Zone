import mongoose from 'mongoose';
import { getConnectionStatus } from '../config/db.js';

export function getHealth(req, res) {
  const dbStatus = getConnectionStatus();
  const isDbConnected = mongoose.connection.readyState === 1;

  if (isDbConnected) {
    return res.status(200).json({
      status: 'ok',
      service: 'DropZone API',
      database: 'connected',
    });
  }

  // If database is not connected, reflect the real status with 503
  return res.status(503).json({
    status: 'unhealthy',
    service: 'DropZone API',
    database: dbStatus,
    message: 'MongoDB is currently disconnected or unavailable.',
  });
}
