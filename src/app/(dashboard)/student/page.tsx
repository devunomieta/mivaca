import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusBadge, PriorityBadge } from '@/components/dashboard/StatusBadge';
import { generateRequestSlug } from '@/lib/utils/slug';
import { Button } from '@/components/ui/button';
import { PlusCircle, ClipboardList, Clock, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Dashboard' };

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch profile
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();

  // Fetch recent requests
  const { data: requests, count } = await adminClient
    .from('service_requests')
    .select('id, title, status, priority, created_at, request_categories(name)', { count: 'exact' })
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Stats
  const { data: allRequests } = await adminClient
    .from('service_requests')
    .select('status')
    .eq('requester_id', user.id);

  const stats = {
    total: allRequests?.length ?? 0,
    pending: allRequests?.filter((r) => r.status === 'pending').length ?? 0,
    in_progress: allRequests?.filter((r) => ['assigned', 'in_progress'].includes(r.status)).length ?? 0,
    completed: allRequests?.filter((r) => r.status === 'completed').length ?? 0,
  };

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Student';

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {firstName}</h1>
          <p className="text-brand-gray text-sm mt-0.5">Here is an overview of your maintenance requests.</p>
        </div>
        <Link href="/student/new-request">
          <Button id="btn-new-request" className="bg-brand-coral hover:bg-brand-coral-hover text-white h-10 gap-2">
            <PlusCircle className="w-4 h-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Submitted" value={stats.total} icon={ClipboardList} />
        <StatsCard title="Pending Review" value={stats.pending} icon={Clock} iconColor="text-amber-500" />
        <StatsCard title="In Progress" value={stats.in_progress} icon={Loader2} iconColor="text-purple-500" />
        <StatsCard title="Completed" value={stats.completed} icon={CheckCircle2} iconColor="text-emerald-500" />
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-xl border border-border shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-brand-navy">Recent Requests</h2>
          <Link href="/student/requests" className="text-sm text-brand-coral hover:underline font-medium">
            View all
          </Link>
        </div>

        {(!requests || requests.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle className="w-10 h-10 text-brand-gray/30 mb-3" />
            <p className="text-brand-navy font-medium">No requests yet</p>
            <p className="text-brand-gray text-sm mt-1">Submit your first maintenance request to get started.</p>
            <Link href="/student/new-request" className="mt-4">
              <Button size="sm" className="bg-brand-coral hover:bg-brand-coral-hover text-white gap-2">
                <PlusCircle className="w-4 h-4" /> Submit Request
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {requests.map((req: any) => (
              <li key={req.id}>
                <Link
                  href={`/student/requests/${generateRequestSlug(req)}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-brand-canvas transition-colors group gap-3"
                >
                  <div className="flex-1 min-w-0 sm:mr-4">
                    <p className="font-medium text-brand-navy text-sm truncate group-hover:text-brand-coral transition-colors">
                      {req.title}
                    </p>
                    <p className="text-xs text-brand-gray mt-0.5">
                      {req.request_categories?.name} &middot;{' '}
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={req.priority} />
                    <StatusBadge status={req.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
