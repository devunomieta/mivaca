'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Download, Filter, ChevronLeft, ChevronRight, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge, PriorityBadge } from '@/components/dashboard/StatusBadge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';
import type { ServiceRequest, Profile, RequestStatus } from '@/types';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState<Profile[]>([]);

  const [status, setStatus] = useState(searchParams.get('status') ?? 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Assignment modal state
  const [assigning, setAssigning] = useState<ServiceRequest | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [assignPending, startAssign] = useTransition();

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

  useEffect(() => {
    fetch('/api/users').then((r) => r.json()).then((j) => setOfficers(j.data ?? []));
  }, []);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [status, debouncedSearch]);

  async function handleAssign() {
    if (!assigning || !selectedOfficer) return;
    startAssign(async () => {
      const res = await fetch(`/api/requests/${assigning.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: selectedOfficer, notes: assignNotes || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success('Request assigned successfully. The officer has been notified.');
      setAssigning(null);
      setSelectedOfficer('');
      setAssignNotes('');
      fetchRequests();
    });
  }

  function handleExport() {
    const params = new URLSearchParams({ ...(status !== 'all' && { status }) });
    window.open(`/api/export?${params}`, '_blank');
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Request Management</h1>
          <p className="text-brand-gray text-sm">{total} total requests</p>
        </div>
        <Button id="btn-export" onClick={handleExport}
          className="bg-brand-coral hover:bg-brand-coral-hover text-white gap-2 h-10">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
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
            <p className="text-brand-navy font-medium">No requests found</p>
            <p className="text-brand-gray text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brand-canvas border-b border-border">
                  {['ID', 'Title', 'Category', 'Requester', 'Priority', 'Status', 'Assigned To', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brand-gray uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req: any) => {
                  const assignedOfficer = req.assignments?.[0]?.profiles?.full_name;
                  return (
                    <tr key={req.id} id={`row-${req.id}`} className="hover:bg-brand-canvas/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-brand-gray">
                        #{req.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm font-medium text-brand-navy truncate">{req.title}</p>
                        <p className="text-xs text-brand-gray truncate">{req.location}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-gray whitespace-nowrap">
                        {req.request_categories?.name}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-brand-navy whitespace-nowrap">{req.profiles?.full_name}</p>
                        <p className="text-xs text-brand-gray">{req.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={req.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3 text-sm text-brand-gray whitespace-nowrap">
                        {assignedOfficer ?? <span className="text-brand-gray/50 italic">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-gray whitespace-nowrap">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        {!['completed', 'cancelled'].includes(req.status) && (
                          <Button id={`btn-assign-${req.id}`} size="sm" variant="outline"
                            onClick={() => setAssigning(req)}
                            className="gap-1.5 h-7 text-xs hover:border-brand-coral hover:text-brand-coral">
                            <UserCheck className="w-3 h-3" />
                            {assignedOfficer ? 'Reassign' : 'Assign'}
                          </Button>
                        )}
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

      {/* Assign Officer Modal */}
      <Dialog open={!!assigning} onOpenChange={(open) => !open && setAssigning(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-navy">Assign Maintenance Officer</DialogTitle>
          </DialogHeader>
          {assigning && (
            <div className="space-y-4 py-2">
              <div className="bg-brand-canvas rounded-lg p-3 border border-border">
                <p className="text-sm font-semibold text-brand-navy">{assigning.title}</p>
                <p className="text-xs text-brand-gray mt-0.5">{(assigning as any).location}</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="select-officer">Select Officer</Label>
                <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                  <SelectTrigger id="select-officer" className="h-11">
                    <SelectValue placeholder="Choose a maintenance officer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {officers.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.full_name} {o.department && `— ${o.department}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assign-notes">Notes for Officer <span className="text-brand-gray font-normal">(optional)</span></Label>
                <Textarea id="assign-notes" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Any specific instructions or context for the officer..."
                  className="resize-none min-h-[80px]" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigning(null)}>Cancel</Button>
            <Button id="btn-confirm-assign" onClick={handleAssign} disabled={!selectedOfficer || assignPending}
              className="bg-brand-coral hover:bg-brand-coral-hover text-white gap-2">
              {assignPending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Assigning...</> : <><UserCheck className="w-4 h-4" />Assign Officer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
