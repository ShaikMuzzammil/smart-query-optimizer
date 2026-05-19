import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'smartquery-dev-secret-2025'

export interface SessionUser { userId: string; email: string; name: string; plan: string }

export function signToken(p: SessionUser) { return jwt.sign(p, SECRET, { expiresIn: '7d' }) }
export function verifyToken(t: string): SessionUser|null {
  try { return jwt.verify(t, SECRET) as SessionUser } catch { return null }
}
