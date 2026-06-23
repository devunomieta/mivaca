import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { updateRequestSchema } from '@/lib/validations/request.schema';

type Params = { params: Promise<{ id: string }> };

// -----------------------------------------------
// GET /api/requests/[id]
// -----------------------------------------------
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await adminClient
      .from('service_requests')
      .select(`
        *,
        profiles!requester_id(id, full_name, email, department, phone),
        request_categories(id, name, description, icon),
        assignments(id, officer_id, assigned_at, notes, profiles!officer_id(id, full_name, email)),
        status_logs(id, old_status, new_status, remarks, created_at, profiles!changed_by(full_name))
      `)
      .eq('id', id)
      .order('created_at', { referencedTable: 'status_logs', ascending: true })
      .single();

    if (error) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    // Validate access
    const profile = await adminClient.from('profiles').select('role_id, roles(name)').eq('id', user.id).single();
    const role = (profile.data?.roles as unknown as { name: string } | null)?.name ?? 'student';

    if (role === 'student' && data.requester_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (role === 'maintenance_officer') {
      const hasAssignment = (data.assignments ?? []).some((a: { officer_id: string }) => a.officer_id === user.id);
      if (!hasAssignment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// -----------------------------------------------
// PATCH /api/requests/[id]
// -----------------------------------------------
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await adminClient.from('profiles').select('role_id, roles(name)').eq('id', user.id).single();
    const role = (profile.data?.roles as unknown as { name: string } | null)?.name ?? 'student';

    if (!['admin', 'maintenance_officer'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('service_requests')
      .update(result.data)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// -----------------------------------------------
// DELETE /api/requests/[id] — Admin only (soft cancel)
// -----------------------------------------------
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await adminClient.from('profiles').select('role_id, roles(name)').eq('id', user.id).single();
    const role = (profile.data?.roles as unknown as { name: string } | null)?.name ?? 'student';
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await adminClient
      .from('service_requests')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: { message: 'Request cancelled successfully' } });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
