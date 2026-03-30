import { NextResponse } from 'next/server';
import { checkReminders } from '@/lib/reminder-scheduler';
import { getSession } from '@/lib/auth';

// Special security header checks for Vercel Cron
// https://vercel.com/docs/cron-jobs#securing-cron-jobs
export async function GET(request: Request) {
  const session = await getSession();
  const authHeader = request.headers.get('authorization');
  
  // In production, require either the CRON_SECRET or a valid user session
  if (process.env.NODE_ENV === 'production') {
    const isCronTrigger = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    if (!isCronTrigger && !session) {
      return NextResponse.json({ error: 'Unauthorized Trigger' }, { status: 401 });
    }
  }

  try {
    console.log('[Cron Job] Triggering reminder check...');
    await checkReminders();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('[Cron Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
