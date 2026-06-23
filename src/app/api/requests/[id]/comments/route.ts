import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { dispatchNotification } from '@/lib/actions/notification.actions';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Enforce RLS by using the authenticated client
    const { data, error } = await supabase
      .from('request_comments')
      .select(`
        *,
        profiles:author_id(full_name, role_id)
      `)
      .eq('request_id', id)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { content, is_internal, evidence_urls } = body;

    if (!content?.trim() && (!evidence_urls || evidence_urls.length === 0)) {
      return NextResponse.json({ error: 'Comment content or attachments are required' }, { status: 400 });
    }

    if (evidence_urls && evidence_urls.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 files allowed' }, { status: 400 });
    }

    // Insert comment using authenticated client (RLS applies)
    const { data: comment, error } = await supabase
      .from('request_comments')
      .insert({
        request_id: id,
        author_id: user.id,
        content: content || '',
        is_internal: is_internal === true,
        evidence_urls: evidence_urls || []
      })
      .select('*, profiles:author_id(full_name, role_id)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Fetch the request to determine who to notify
    const { data: req } = await adminClient
      .from('service_requests')
      .select('requester_id, title, assignments(officer_id)')
      .eq('id', id)
      .single();

    if (req) {
      const assignments = req.assignments as any;
      const officerId = Array.isArray(assignments) ? assignments[0]?.officer_id : assignments?.officer_id;
      const isAuthorStudent = user.id === req.requester_id;
      const isAuthorOfficer = user.id === officerId;

      const title = 'New Message on Request';
      const message = `A new message was added to your request: "${req.title}"`;

      // Dispatch notifications based on visibility
      if (is_internal) {
        // Internal message: notify admin or officer
        if (isAuthorOfficer) {
          // Notify admins
          const { data: admins } = await adminClient.from('profiles').select('id').eq('role_id', 3);
          admins?.forEach(admin => {
            dispatchNotification({
              userId: admin.id,
              title: 'Internal Note Added',
              message: `Officer added an internal note to "${req.title}"`,
              type: 'status_updated',
              link: `/admin/requests`
            });
          });
        } else {
          // Admin wrote it, notify officer
          if (officerId) {
            dispatchNotification({
              userId: officerId,
              title: 'Internal Note Added',
              message: `Admin added an internal note to "${req.title}"`,
              type: 'status_updated',
              link: `/officer/requests`
            });
          }
        }
      } else {
        // Public message
        if (!isAuthorStudent) {
          dispatchNotification({
            userId: req.requester_id,
            title,
            message,
            type: 'status_updated',
            link: `/student/requests`,
            sendEmail: true,
            requestId: id
          });
        }
        if (!isAuthorOfficer && officerId) {
          dispatchNotification({
            userId: officerId,
            title,
            message,
            type: 'status_updated',
            link: `/officer/requests`,
            sendEmail: true,
            requestId: id
          });
        }
      }
    }

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (err: any) {
    console.error('API Comment POST Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
