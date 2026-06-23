import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

// -----------------------------------------------
// GET /api/requests/stats — Get aggregate status counts
// -----------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await adminClient.from('profiles').select('role_id').eq('id', user.id).single();
    const ROLE_MAP: Record<number, string> = { 1: 'student', 2: 'maintenance_officer', 3: 'admin' };
    const role = ROLE_MAP[profile.data?.role_id as number] ?? 'student';

    let query = adminClient.from('service_requests').select('id, status', { count: 'exact' });

    // Role-based scoping
    if (role === 'student') {
      query = query.eq('requester_id', user.id);
    } else if (role === 'maintenance_officer') {
      const { data: myAssignments } = await adminClient.from('assignments').select('request_id').eq('officer_id', user.id);
      const ids = (myAssignments ?? []).map((a) => a.request_id);
      if (ids.length === 0) return NextResponse.json({ data: {} });
      query = query.in('id', ids);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Aggregate counts
    const counts: Record<string, number> = {
      all: data.length,
      pending: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    data.forEach((req) => {
      if (counts[req.status] !== undefined) {
        counts[req.status]++;
      } else {
        counts[req.status] = 1;
      }
    });

    return NextResponse.json({ data: counts });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
