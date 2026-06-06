import { NextResponse } from 'next/server';
import { isDBConnected } from '../../../lib/mongodb';

const START_TIME = Date.now();

export async function GET() {
  const dbOk = isDBConnected();
  return NextResponse.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor((Date.now() - START_TIME) / 1000),
    version:   process.env.npm_package_version || '2.0.0',
    services: {
      database: dbOk                                    ? 'connected'   : 'disconnected',
      ai:       !!process.env.OPENAI_API_KEY            ? 'available'   : 'unavailable',
      email:    !!process.env.RESEND_API_KEY            ? 'available'   : 'unavailable',
    },
  });
}
