import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { assignRequestSchema } from '@/lib/validations/request.schema';
import { sendAssignmentAlert } from '@/lib/actions/email.actions';

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
    const profile = await adminClient.from('profiles').select('role_id, roles(name)').eq('id', user.id).single();
    const role = (profile.data?.roles as unknown as { name: string } | null)?.name ?? 'student';
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

    // Trigger assignment alert email (non-blocking)
    sendAssignmentAlert(requestId, officer_id).catch(console.error);

    return NextResponse.json({ data: { assignment, status: updatedRequest?.status } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
