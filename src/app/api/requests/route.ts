import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { createRequestSchema } from '@/lib/validations/request.schema';
import { sendRequestConfirmation } from '@/lib/actions/email.actions';
import type { RequestFilters } from '@/types';

// -----------------------------------------------
// GET /api/requests — List requests (role-filtered)
// -----------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role_id, roles(name)')
      .eq('id', user.id)
      .single();
    const role = (profile?.roles as { name: string } | null)?.name ?? 'student';

    const { searchParams } = new URL(request.url);
    const filters: RequestFilters = {
      status: (searchParams.get('status') as RequestFilters['status']) ?? 'all',
      category: searchParams.get('category') ? Number(searchParams.get('category')) : 'all',
      priority: (searchParams.get('priority') as RequestFilters['priority']) ?? 'all',
      search: searchParams.get('search') ?? '',
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 20),
      sort: (searchParams.get('sort') as RequestFilters['sort']) ?? 'created_at',
      order: (searchParams.get('order') as 'asc' | 'desc') ?? 'desc',
    };

    const offset = (filters.page! - 1) * filters.limit!;

    let query = adminClient
      .from('service_requests')
      .select(`
        *,
        profiles!requester_id(id, full_name, email, department),
        request_categories(id, name, icon),
        assignments(id, officer_id, assigned_at, notes, profiles!officer_id(full_name, email))
      `, { count: 'exact' });

    // Role-based scoping
    if (role === 'student') {
      query = query.eq('requester_id', user.id);
    } else if (role === 'maintenance_officer') {
      const { data: myAssignments } = await adminClient
        .from('assignments')
        .select('request_id')
        .eq('officer_id', user.id);
      const ids = (myAssignments ?? []).map((a) => a.request_id);
      if (ids.length === 0) return NextResponse.json({ data: [], total: 0, page: 1, limit: filters.limit, totalPages: 0 });
      query = query.in('id', ids);
    }
    // admin sees all

    // Apply filters
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.category && filters.category !== 'all') query = query.eq('category_id', filters.category);
    if (filters.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority);
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
    }

    query = query
      .order(filters.sort!, { ascending: filters.order === 'asc' })
      .range(offset, offset + filters.limit! - 1);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const total = count ?? 0;
    const totalPages = Math.ceil(total / filters.limit!);

    return NextResponse.json({ data, total, page: filters.page, limit: filters.limit, totalPages });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// -----------------------------------------------
// POST /api/requests — Create new service request
// -----------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('service_requests')
      .insert({ ...result.data, requester_id: user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Log initial status
    await adminClient.from('status_logs').insert({
      request_id: data.id,
      changed_by: user.id,
      old_status: null,
      new_status: 'pending',
      remarks: 'Request submitted',
    });

    // Trigger confirmation email (non-blocking)
    sendRequestConfirmation(data.id).catch(console.error);

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
