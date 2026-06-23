'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, PriorityBadge } from '@/components/dashboard/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import type { ServiceRequest } from '@/types';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function StudentRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState(searchParams.get('status') ?? 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status, page: String(page), limit: '20',
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await fetch(`/api/requests?${params}`);
      const json = await res.json();
      setRequests(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [status, page, debouncedSearch]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [status, debouncedSearch]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Requests</h1>
          <p className="text-brand-gray text-sm">{total} total requests submitted</p>
        </div>
        <Link href="/student/new-request">
          <Button className="bg-brand-coral hover:bg-brand-coral-hover text-white h-10">
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border shadow-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
            <Input id="search-requests" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, location, or description..."
              className="pl-10 h-10" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-navy">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-1 mt-4 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button key={tab.value} id={`tab-${tab.value}`}
              onClick={() => setStatus(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                status === tab.value
                  ? 'bg-brand-coral text-white'
                  : 'text-brand-gray hover:bg-brand-canvas hover:text-brand-navy'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-coral border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle className="w-10 h-10 text-brand-gray/30 mx-auto mb-3" />
            <p className="text-brand-navy font-medium">No requests found</p>
            <p className="text-brand-gray text-sm mt-1">Try adjusting your filters or create a new request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brand-canvas border-b border-border">
                  {['ID', 'Title', 'Category', 'Location', 'Priority', 'Status', 'Submitted'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brand-gray uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req: any) => {
                  return (
                    <tr key={req.id} id={`row-${req.id}`} className="hover:bg-brand-canvas/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-brand-gray">
                        <Link href={`/student/requests/${req.id}`} className="hover:text-brand-coral transition-colors">
                          #{req.id.slice(0, 8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-[250px]">
                        <Link href={`/student/requests/${req.id}`}>
                          <p className="text-sm font-medium text-brand-navy truncate hover:text-brand-coral transition-colors">{req.title}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-gray whitespace-nowrap">
                        {req.request_categories?.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-gray whitespace-nowrap truncate max-w-[200px]">
                        {req.location}
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={req.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3 text-xs text-brand-gray whitespace-nowrap">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-brand-gray">
              Page {page} of {totalPages} &middot; {total} results
            </p>
            <div className="flex gap-2">
              <Button id="btn-prev-page" variant="outline" size="sm" disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <Button id="btn-next-page" variant="outline" size="sm" disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)} className="gap-1">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
