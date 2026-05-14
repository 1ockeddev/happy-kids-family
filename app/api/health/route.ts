import { testConnection } from '@/lib/db';
import { ok, serverError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const connected = await testConnection();
    return ok({ status: connected ? 'ok' : 'error', db: connected ? 'connected' : 'unreachable', ts: new Date().toISOString() });
  } catch (err) {
    return serverError(err);
  }
}
