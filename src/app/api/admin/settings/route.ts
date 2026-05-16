import { NextRequest, NextResponse } from 'next/server'

const settingsStore = new Map<string, string>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (body.emailSettings) {
      for (const [k, v] of Object.entries(body.emailSettings)) {
        settingsStore.set(k, String(v))
      }
    }
    return NextResponse.json({ ok: true, message: 'Settings saved.' })
  } catch {
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 })
  }
}

export async function GET() {
  const settings: Record<string, string> = {}
  settingsStore.forEach((v, k) => {
    settings[k] = ['resendApiKey', 'stripeSecretKey'].includes(k) ? '••••••••' : v
  })
  return NextResponse.json({ settings })
}
