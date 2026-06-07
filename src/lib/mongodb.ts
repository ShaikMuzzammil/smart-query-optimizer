import mongoose from 'mongoose'
const URI = process.env.MONGODB_URI || ''
interface C { conn: typeof mongoose|null; promise: Promise<typeof mongoose>|null }
declare global { var _mg: C|undefined }
const c: C = global._mg || { conn:null, promise:null }
if (!global._mg) global._mg = c
export async function connectDB() {
  if (!URI) return null; if (c.conn) return c.conn
  if (!c.promise) c.promise = mongoose.connect(URI,{bufferCommands:false,serverSelectionTimeoutMS:5000}).catch(e=>{c.promise=null;throw e})
  try { c.conn = await c.promise } catch { c.promise=null; return null }
  return c.conn
}
export const isDBConnected = () => mongoose.connection.readyState === 1
