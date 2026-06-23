import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { exportRequestsToCSV } from '@/lib/utils/export';

// -----------------------------------------------
// GET /api/export — Export all requests to CSV (Admin only)
// -----------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await adminClient.from('profiles').select('role_id, roles(name)').eq('id', user.id).single();
    const role = (profile.data?.roles as unknown as { name: string })?.name ?? 'student';
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let query = adminClient
      .from('service_requests')
      .select(`
        *,
        profiles!requester_id(full_name, email),
        request_categories(name),
        assignments(officer_id, profiles!officer_id(full_name))
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const csvContent = exportRequestsToCSV(data as any);
    const filename = `miva-maintenance-requests-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
