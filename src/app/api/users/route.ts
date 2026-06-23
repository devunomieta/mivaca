import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

// -----------------------------------------------
// GET /api/users — List maintenance officers (Admin only)
// -----------------------------------------------
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await adminClient.from('profiles').select('role_id, roles(name)').eq('id', user.id).single();
    const role = (profile.data?.roles as unknown as { name: string } | null)?.name ?? 'student';
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Get maintenance officers
    const { data: officerRole } = await adminClient.from('roles').select('id').eq('name', 'maintenance_officer').single();
    if (!officerRole) return NextResponse.json({ data: [] });

    const { data, error } = await adminClient
      .from('profiles')
      .select('id, full_name, email, department, phone, is_active, created_at')
      .eq('role_id', officerRole.id)
      .eq('is_active', true)
      .order('full_name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
