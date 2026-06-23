import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { statusUpdateSchema } from '@/lib/validations/request.schema';
import { sendStatusUpdateAlert } from '@/lib/actions/email.actions';

// -----------------------------------------------
// POST /api/status-logs — Officer/Admin only
// -----------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profileRes = await adminClient
      .from('profiles')
      .select('full_name, role_id, roles(name)')
      .eq('id', user.id)
      .single();
    const role = (profileRes.data?.roles as unknown as { name: string } | null)?.name ?? 'student';

    if (!['admin', 'maintenance_officer'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = statusUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { request_id, new_status, remarks } = result.data;

    // Get current status
    const { data: currentRequest, error: fetchError } = await adminClient
      .from('service_requests')
      .select('status')
      .eq('id', request_id)
      .single();

    if (fetchError || !currentRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const old_status = currentRequest.status;

    // Update request status
    const { error: updateError } = await adminClient
      .from('service_requests')
      .update({ status: new_status })
      .eq('id', request_id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // Log the status change
    const { data: log, error: logError } = await adminClient
      .from('status_logs')
      .insert({
        request_id,
        changed_by: user.id,
        old_status,
        new_status,
        remarks: remarks ?? null,
      })
      .select()
      .single();

    if (logError) return NextResponse.json({ error: logError.message }, { status: 500 });

    // Trigger status update email to student (non-blocking)
    sendStatusUpdateAlert(
      request_id,
      new_status,
      old_status,
      remarks,
      profileRes.data?.full_name ?? undefined
    ).catch(console.error);

    return NextResponse.json({ data: log }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// -----------------------------------------------
// GET /api/status-logs?request_id=xxx — Get audit trail
// -----------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('request_id');
    if (!requestId) return NextResponse.json({ error: 'request_id is required' }, { status: 400 });

    const { data, error } = await adminClient
      .from('status_logs')
      .select('*, profiles!changed_by(full_name, role_id, roles(name))')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
