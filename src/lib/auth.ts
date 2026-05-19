import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'smartquery-dev-secret-2025'
)

export interface SessionUser {
  userId: string; email: string; name: string; plan: string
}

export async function signToken(p: SessionUser): Promise<string> {
  return new SignJWT({ ...p })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifyToken(t: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(t, SECRET)
    return payload as unknown as SessionUser
  } catch { return null }
}