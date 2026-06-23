'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Search, ChevronLeft, ChevronRight, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import type { Profile } from '@/types';

const ROLE_TABS = [
  { label: 'All Users', value: 'all' },
  { label: 'Students', value: 'student' },
  { label: 'Maintenance Officers', value: 'maintenance_officer' },
  { label: 'Admins', value: 'admin' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState(searchParams.get('role') ?? 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        role, page: String(page), limit: '20',
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await fetch(`/api/users?${params}`);
      const json = await res.json();
      setUsers(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [role, page, debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [role, debouncedSearch]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-brand-gray text-sm">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border shadow-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
            <Input id="search-users" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or department..."
              className="pl-10 h-10" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-navy">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-1 mt-4 flex-wrap">
          {ROLE_TABS.map((tab) => (
            <button key={tab.value} id={`tab-${tab.value}`}
              onClick={() => setRole(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                role === tab.value
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
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-10 h-10 text-brand-gray/30 mx-auto mb-3" />
            <p className="text-brand-navy font-medium">No users found</p>
            <p className="text-brand-gray text-sm mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-brand-canvas border-b border-border">
                  {['Name', 'Email', 'Role', 'Department', 'Phone', 'Status', 'Joined'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brand-gray uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u: any) => {
                  return (
                    <tr key={u.id} className="hover:bg-brand-canvas/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-brand-navy whitespace-nowrap">{u.full_name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-gray">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                          u.roles?.name === 'admin' ? 'bg-purple-100 text-purple-700' :
                          u.roles?.name === 'maintenance_officer' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {u.roles?.name?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-gray whitespace-nowrap">
                        {u.department || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-brand-gray whitespace-nowrap">
                        {u.phone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-brand-gray whitespace-nowrap">
                        {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
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
