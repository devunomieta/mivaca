import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ClipboardList, Clock, CheckCircle2, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Dashboard' };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch all requests stats
  const { data: allRequests } = await adminClient
    .from('service_requests')
    .select('status, created_at');

  const stats = {
    total: allRequests?.length ?? 0,
    pending: allRequests?.filter((r) => r.status === 'pending').length ?? 0,
    in_progress: allRequests?.filter((r) => ['assigned', 'in_progress'].includes(r.status)).length ?? 0,
    completed: allRequests?.filter((r) => r.status === 'completed').length ?? 0,
  };

  const resolutionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  // Count officers and students
  const { data: officerRole } = await adminClient.from('roles').select('id').eq('name', 'maintenance_officer').single();
  const { count: officerCount } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role_id', officerRole?.id ?? 0);

  const { count: totalUsers } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  // Recent pending requests
  const { data: recentPending } = await adminClient
    .from('service_requests')
    .select('id, title, priority, created_at, request_categories(name), profiles!requester_id(full_name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-brand-gray text-sm mt-0.5">University-wide maintenance overview</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/requests">
            <Button variant="outline" className="h-10 gap-2 border-border hover:border-brand-coral hover:text-brand-coral">
              <ClipboardList className="w-4 h-4" />
              Manage Requests
            </Button>
          </Link>
          <a href="/api/export" target="_blank" rel="noopener noreferrer">
            <Button id="btn-export-csv" className="bg-brand-coral hover:bg-brand-coral-hover text-white h-10 gap-2">
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Total Requests" value={stats.total} icon={ClipboardList} />
        <StatsCard title="Pending" value={stats.pending} icon={Clock} iconColor="text-amber-500" />
        <StatsCard title="In Progress" value={stats.in_progress} icon={AlertTriangle} iconColor="text-purple-500" />
        <StatsCard title="Resolution Rate" value={`${resolutionRate}%`} icon={TrendingUp} iconColor="text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard title="Total Users" value={totalUsers ?? 0} icon={Users} iconColor="text-blue-500" />
        <StatsCard title="Maintenance Officers" value={officerCount ?? 0} icon={Users} iconColor="text-brand-coral" />
        <StatsCard title="Completed" value={stats.completed} icon={CheckCircle2} iconColor="text-emerald-500" />
      </div>

      {/* Pending requests needing assignment */}
      <div className="bg-white rounded-xl border border-border shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-brand-navy">Unassigned Requests</h2>
          <Link href="/admin/requests?status=pending" className="text-sm text-brand-coral hover:underline font-medium">
            View all pending
          </Link>
        </div>

        {(!recentPending || recentPending.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
            <p className="text-brand-navy font-medium">No unassigned requests</p>
            <p className="text-brand-gray text-sm">All requests have been assigned.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentPending.map((req: any) => (
              <li key={req.id}>
                <Link href={`/admin/requests?highlight=${req.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-brand-canvas transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-brand-navy text-sm truncate group-hover:text-brand-coral transition-colors">
                      {req.title}
                    </p>
                    <p className="text-xs text-brand-gray mt-0.5">
                      {req.request_categories?.name} &middot; {req.profiles?.full_name}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ml-4 ${
                    req.priority === 'critical' ? 'bg-red-100 text-red-700' :
                    req.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    req.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {req.priority.toUpperCase()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
