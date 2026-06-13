import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// eslint-disable-next-line no-var
declare global {
  // eslint-disable-next-line no-var
  var __sqMongoose: CachedConnection | undefined;
}

const cached: CachedConnection = global.__sqMongoose || { conn: null, promise: null };
global.__sqMongoose = cached;

export async function dbConnect(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) {
    // App can run in "demo / no-db" mode for local exploration without Mongo configured.
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export function isDbConfigured(): boolean {
  return !!MONGODB_URI;
}
