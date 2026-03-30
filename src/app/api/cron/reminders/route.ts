import { NextResponse } from 'next/server';
import { checkReminders } from '@/lib/reminder-scheduler';

// Special security header checks for Vercel Cron
// https://vercel.com/docs/cron-jobs#securing-cron-jobs
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // In development, you can skip this by checking Node environment
  if (process.env.NODE_ENV === 'production') {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
