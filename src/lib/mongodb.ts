import mongoose from 'mongoose'

const URI = process.env.MONGODB_URI || ''

interface Cache { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
declare global { var _mongoCache: Cache | undefined }
const cache: Cache = global._mongoCache || { conn: null, promise: null }
if (!global._mongoCache) global._mongoCache = cache

export async function connectDB() {
  if (!URI) return null
  if (cache.conn) return cache.conn
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(URI, { bufferCommands: false, serverSelectionTimeoutMS: 5000 })
      .catch(e => { cache.promise = null; throw e })
  }
  try { cache.conn = await cache.promise }
  catch { cache.promise = null; return null }
  return cache.conn
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1
}
