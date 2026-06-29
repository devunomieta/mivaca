'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Download, Filter, ChevronLeft, ChevronRight, UserCheck, X, Eye, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
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
  const [stats, setStats] = useState<Record<string, number>>({});

  const [status, setStatus] = useState(searchParams.get('status') ?? 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [sortCol, setSortCol] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [assigning, setAssigning] = useState<ServiceRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<ServiceRequest | null>(null);
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
        sort: sortCol, order: sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await fetch(`/api/requests?${params}`);
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || 'Failed to fetch');
        return;
      }
      setRequests(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [status, page, debouncedSearch, sortCol, sortOrder]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/requests/stats');
      const json = await res.json();
      if (res.ok && json.data) setStats(json.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { 
    fetchRequests(); 
    fetchStats();
  }, [fetchRequests, fetchStats]);

  useEffect(() => {
    // Only fetch officers
    fetch('/api/users?role=maintenance_officer&limit=100')
      .then((r) => r.json())
      .then((j) => setOfficers(j.data ?? []));
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
      fetchStats();
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
          <p className="text-brand-gray text-sm">{stats.all ?? 0} total requests</p>
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
          {STATUS_TABS.map((tab) => {
            const count = stats[tab.value] ?? 0;
            return (
              <button key={tab.value} id={`tab-${tab.value}`}
                onClick={() => setStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  status === tab.value
                    ? 'bg-brand-coral text-white'
                    : 'text-brand-gray hover:bg-brand-canvas hover:text-brand-navy'
                }`}>
                {tab.label} {count > 0 && <span className="opacity-80 ml-1">({count})</span>}
              </button>
            );
          })}
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
                  {[
                    { label: 'ID', dbCol: 'id' },
                    { label: 'Title', dbCol: 'title' },
                    { label: 'Category', dbCol: null },
                    { label: 'Requester', dbCol: null },
                    { label: 'Priority', dbCol: 'priority' },
                    { label: 'Status', dbCol: 'status' },
                    { label: 'Assigned To', dbCol: null },
                    { label: 'Date', dbCol: 'created_at' },
                    { label: 'Actions', dbCol: null },
                  ].map((col) => (
                    <th key={col.label} className="px-5 py-4 text-left text-xs font-semibold text-brand-gray uppercase tracking-wider whitespace-nowrap">
                      {col.dbCol ? (
                        <button 
                          onClick={() => handleSort(col.dbCol as string)}
                          className="flex items-center gap-1.5 hover:text-brand-navy transition-colors outline-none"
                        >
                          {col.label}
                          {sortCol === col.dbCol ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-brand-coral" /> : <ArrowDown className="w-3.5 h-3.5 text-brand-coral" />
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req: any) => {
                  const assignment = Array.isArray(req.assignments) ? req.assignments[0] : req.assignments;
                  const assignedOfficer = assignment?.profiles?.full_name;
                  return (
                    <tr key={req.id} id={`row-${req.id}`} className="hover:bg-brand-canvas/50 transition-colors">
                      <td className="px-5 py-4 text-xs font-mono text-brand-gray whitespace-nowrap">
                        #{req.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 min-w-[240px] cursor-pointer group" onClick={() => setViewingRequest(req)}>
                        <p className="text-sm font-medium text-brand-navy truncate group-hover:text-brand-coral transition-colors">{req.title}</p>
                        <p className="text-xs text-brand-gray truncate">{req.location}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-brand-gray whitespace-nowrap">
                        {req.request_categories?.name}
                      </td>
                      <td className="px-5 py-4 min-w-[160px]">
                        <p className="text-sm text-brand-navy truncate">{req.profiles?.full_name}</p>
                        <p className="text-xs text-brand-gray truncate">{req.profiles?.email}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap"><PriorityBadge priority={req.priority} /></td>
                      <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={req.status} /></td>
                      <td className="px-5 py-4 text-sm text-brand-gray whitespace-nowrap">
                        {assignedOfficer ?? <span className="text-brand-gray/50 italic">Unassigned</span>}
                      </td>
                      <td className="px-5 py-4 text-xs text-brand-gray whitespace-nowrap">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => setViewingRequest(req)} className="h-7 w-7 text-brand-gray hover:text-brand-navy">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!['completed', 'cancelled'].includes(req.status) && (
                            <Button id={`btn-assign-${req.id}`} size="sm" variant="outline"
                              onClick={() => setAssigning(req)}
                              className="gap-1.5 h-7 text-xs hover:bg-brand-coral hover:text-white hover:border-brand-coral transition-colors">
                              <UserCheck className="w-3 h-3" />
                              {assignedOfficer ? 'Reassign' : 'Assign'}
                            </Button>
                          )}
                        </div>
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

      {/* View Request Details Modal */}
      <Dialog open={!!viewingRequest} onOpenChange={(open) => !open && setViewingRequest(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-brand-navy flex flex-wrap items-center gap-2 sm:gap-3">
              Request Details
              {viewingRequest && <StatusBadge status={viewingRequest.status} />}
              {viewingRequest && <PriorityBadge priority={viewingRequest.priority} />}
            </DialogTitle>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-navy">{viewingRequest.title}</h3>
                <div className="text-sm text-brand-gray mt-2 flex items-start gap-2">
                  <span className="font-medium text-brand-navy shrink-0">Location:</span> 
                  <span className="leading-tight pt-0.5">{(viewingRequest as any).location}</span>
                </div>
                <div className="text-sm text-brand-gray mt-2 flex items-start gap-2">
                  <span className="font-medium text-brand-navy shrink-0">Category:</span> 
                  <span className="leading-tight pt-0.5">{(viewingRequest as any).request_categories?.name}</span>
                </div>
              </div>

              <div className="bg-brand-canvas rounded-xl p-4 text-sm text-brand-navy whitespace-pre-wrap border border-border">
                {viewingRequest.description}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-border pt-4">
                <div>
                  <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-2">Requester</p>
                  <p className="text-sm font-medium text-brand-navy truncate">{(viewingRequest as any).profiles?.full_name}</p>
                  <p className="text-xs text-brand-gray truncate">{(viewingRequest as any).profiles?.email}</p>
                  {(viewingRequest as any).profiles?.department && (
                    <p className="text-xs text-brand-gray line-clamp-2">{(viewingRequest as any).profiles?.department}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-2">Assignment</p>
                  {(() => {
                    const viewAssig = Array.isArray(viewingRequest.assignments) ? viewingRequest.assignments[0] : viewingRequest.assignments;
                    return viewAssig ? (
                      <>
                        <p className="text-sm font-medium text-brand-navy">{viewAssig.profiles?.full_name}</p>
                        <p className="text-xs text-brand-gray">{viewAssig.profiles?.email}</p>
                      </>
                    ) : (
                      <p className="text-sm italic text-brand-gray">Unassigned</p>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRequest(null)}>Close</Button>
            {viewingRequest && !['completed', 'cancelled'].includes(viewingRequest.status) && (
              <Button 
                onClick={() => {
                  setAssigning(viewingRequest);
                  setViewingRequest(null);
                }}
                className="bg-brand-coral hover:bg-brand-coral-hover text-white">
                {(Array.isArray(viewingRequest.assignments) ? viewingRequest.assignments[0] : viewingRequest.assignments) ? 'Reassign Officer' : 'Assign Officer'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Officer Modal */}
      <Dialog open={!!assigning} onOpenChange={(open) => !open && setAssigning(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-brand-navy">
              {(Array.isArray(assigning?.assignments) ? assigning?.assignments[0] : assigning?.assignments) ? 'Reassign Maintenance Officer' : 'Assign Maintenance Officer'}
            </DialogTitle>
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
                    {officers.length === 0 && (
                      <div className="px-2 py-4 text-sm text-brand-gray text-center">No officers found</div>
                    )}
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
              {assignPending ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
              ) : (
                <><UserCheck className="w-4 h-4" />{(Array.isArray(assigning?.assignments) ? assigning?.assignments[0] : assigning?.assignments) ? 'Reassign Officer' : 'Assign Officer'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
