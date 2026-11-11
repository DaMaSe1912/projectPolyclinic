import { NextResponse } from 'next/server';
import { getDbAsync } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const role = searchParams.get('role');

    const db = await getDbAsync();
    let logs = db.auditLogs;

    if (targetType) {
      logs = logs.filter((l) => l.targetType === targetType);
    }
    if (role) {
      logs = logs.filter((l) => l.actorRole === role);
    }

    return NextResponse.json({ success: true, data: logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
