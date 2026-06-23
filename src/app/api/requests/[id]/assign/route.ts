import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { assignRequestSchema } from '@/lib/validations/request.schema';
import { dispatchNotification } from '@/lib/actions/notification.actions';

type Params = { params: Promise<{ id: string }> };

// -----------------------------------------------
// POST /api/requests/[id]/assign — Admin only
// -----------------------------------------------
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: requestId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Admin-only guard
    const profile = await adminClient.from('profiles').select('role_id').eq('id', user.id).single();
    const ROLE_MAP: Record<number, string> = { 1: 'student', 2: 'maintenance_officer', 3: 'admin' };
    const role = ROLE_MAP[profile.data?.role_id as number] ?? 'student';
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 });

    const body = await request.json();
    const result = assignRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { officer_id, notes } = result.data;

    // Upsert assignment (replace if already assigned)
    const { data: assignment, error: assignError } = await adminClient
      .from('assignments')
      .upsert({
        request_id: requestId,
        officer_id,
        assigned_by: user.id,
        notes: notes ?? null,
        assigned_at: new Date().toISOString(),
      }, { onConflict: 'request_id' })
      .select()
      .single();

    if (assignError) return NextResponse.json({ error: assignError.message }, { status: 500 });

    // Update request status to 'assigned'
    const { data: updatedRequest, error: updateError } = await adminClient
      .from('service_requests')
      .update({ status: 'assigned' })
      .eq('id', requestId)
      .select('status')
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // Log the assignment
    await adminClient.from('status_logs').insert({
      request_id: requestId,
      changed_by: user.id,
      old_status: 'pending',
      new_status: 'assigned',
      remarks: notes ? `Assigned with note: ${notes}` : 'Request assigned to officer',
    });

    // Trigger notification to officer
    dispatchNotification({
      userId: officer_id,
      title: 'New Task Assigned',
      message: `You have been assigned to request #${requestId.slice(0, 8).toUpperCase()}`,
      type: 'request_assigned',
      link: `/officer/requests`,
      sendEmail: true,
      requestId: requestId,
    });

    return NextResponse.json({ data: { assignment, status: updatedRequest?.status } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
