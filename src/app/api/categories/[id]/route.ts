import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await adminClient.from('profiles').select('role_id').eq('id', user.id).single();
    if (profile.data?.role_id !== 3) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    
    const { data, error } = await adminClient
      .from('request_categories')
      .update(body)
      .eq('id', Number(id))
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await adminClient.from('profiles').select('role_id').eq('id', user.id).single();
    if (profile.data?.role_id !== 3) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Check if category is used
    const { count } = await adminClient
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', Number(id));

    if (count && count > 0) {
      return NextResponse.json({ error: 'Cannot delete category that is currently used by requests' }, { status: 400 });
    }

    const { error } = await adminClient
      .from('request_categories')
      .delete()
      .eq('id', Number(id));

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
