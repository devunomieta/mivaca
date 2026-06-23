import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusBadge, PriorityBadge } from '@/components/dashboard/StatusBadge';
import { Wrench, Clock, CheckCircle2, ClipboardList, MapPin, User, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Tasks' };

export default async function OfficerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Officer';

  // Get assignments for this officer
  const { data: assignments } = await adminClient
    .from('assignments')
    .select('request_id')
    .eq('officer_id', user.id);

  const requestIds = (assignments ?? []).map((a) => a.request_id);

  let requests: any[] = [];
  if (requestIds.length > 0) {
    const { data } = await adminClient
      .from('service_requests')
      .select('*, request_categories(name), profiles!requester_id(full_name, email)')
      .in('id', requestIds)
      .order('created_at', { ascending: false });
    requests = data ?? [];
  }

  const stats = {
    total: requests.length,
    assigned: requests.filter((r) => r.status === 'assigned').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  };

  const activeTasks = requests.filter((r) => ['assigned', 'in_progress'].includes(r.status));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hello, {firstName}</h1>
          <p className="text-brand-gray text-sm mt-0.5">
            You have <span className="text-brand-coral font-semibold">{activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}</span> requiring attention.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Assigned" value={stats.total} icon={ClipboardList} />
        <StatsCard title="Awaiting Action" value={stats.assigned} icon={Clock} iconColor="text-blue-500" />
        <StatsCard title="In Progress" value={stats.in_progress} icon={Wrench} iconColor="text-purple-500" />
        <StatsCard title="Completed" value={stats.completed} icon={CheckCircle2} iconColor="text-emerald-500" />
      </div>

      {/* Active Tasks */}
      <div className="bg-white rounded-xl border border-border shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-brand-navy">Active Tasks</h2>
          <span className="text-xs bg-brand-coral/10 text-brand-coral font-medium px-2 py-1 rounded-full">
            {activeTasks.length} pending
          </span>
        </div>

        {activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mb-3" />
            <p className="text-brand-navy font-medium">All clear!</p>
            <p className="text-brand-gray text-sm mt-1">No active tasks at the moment. Great work!</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {activeTasks.map((req: any) => (
              <li key={req.id}>
                <Link
                  href={`/officer/requests/${req.id}`}
                  className="block px-6 py-4 hover:bg-brand-canvas transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-navy text-sm group-hover:text-brand-coral transition-colors truncate">
                        {req.title}
                      </p>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-brand-gray">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{req.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />{req.profiles?.full_name}
                        </span>
                      </div>
                      <p className="text-xs text-brand-gray mt-1">
                        {req.request_categories?.name} &middot; {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <PriorityBadge priority={req.priority} />
                      <StatusBadge status={req.status} />
                    </div>
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
