import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'smartquery-dev-secret-2025'

export interface SessionUser {
  userId: string
  email: string
  name: string
  plan: string
}

export function signToken(payload: SessionUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser
  } catch {
    return null
  }
}
