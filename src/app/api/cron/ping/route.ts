import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    // Optional: Protect the route using a secret key
    // For Vercel Cron Jobs, Vercel sends an Authorization header with your CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Ping the database by querying a single row
    // We use the admin client since this is an automated background task without a user session
    const { error } = await adminClient.from('profiles').select('id').limit(1);

    if (error) {
      console.error('Database ping failed:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database pinged successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
