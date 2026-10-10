import mongoose from 'mongoose';

/**
 * Safely masks credentials in MongoDB connection strings before logging.
 * Supports standard mongodb:// and Atlas mongodb+srv:// URIs.
 */
function maskMongoUri(rawUri) {
  if (!rawUri) return '';
  return rawUri.replace(/(mongodb(?:\+srv)?:\/\/)[^:]+:[^@]+(@)/i, '$1***:***$2');
}

/**
 * Checks the current Mongoose connection status.
 * @returns {'connected' | 'connecting' | 'disconnecting' | 'disconnected'}
 */
export function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'disconnected';
}

/**
 * Connects to MongoDB Atlas using the provided URI.
 * Reads MONGODB_URI from process.env by default.
 * Does not create duplicate connections.
 * Never logs credentials.
 */
export async function connectDB(customUri = null) {
  const uri = customUri || process.env.MONGODB_URI;

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    console.log('[DropZone DB] MongoDB connection already in progress, awaiting resolution...');
    await new Promise((resolve) => mongoose.connection.once('open', resolve));
    return mongoose.connection;
  }

  if (!uri) {
    console.warn('[DropZone DB] MONGODB_URI is not set. Running in offline/disconnected database mode.');
    return null;
  }

  // Register connection lifecycle listeners once
  if (!mongoose.connection._hasDropZoneListeners) {
    mongoose.connection.on('error', (err) => {
      console.error('[DropZone DB] Runtime MongoDB error:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('[DropZone DB] MongoDB disconnected from host.');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('[DropZone DB] MongoDB reconnected successfully.');
    });
    mongoose.connection._hasDropZoneListeners = true;
  }

  try {
    const maskedUri = maskMongoUri(uri);
    console.log(`[DropZone DB] Attempting connection to MongoDB (${maskedUri})...`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10s for reliable Atlas SRV lookup and TLS handshake
      autoIndex: process.env.NODE_ENV !== 'production', // disable automatic index builds in production for performance
    });

    console.log(`[DropZone DB] MongoDB connected successfully to host: ${conn.connection.host}`);
    return conn.connection;
  } catch (err) {
    console.error('[DropZone DB] Connection error:', err.message);
    return null;
  }
}

/**
 * Safely disconnects the database connection.
 */
export async function closeDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('[DropZone DB] MongoDB connection closed safely.');
  }
}
