'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Wrench,
  Bell,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOutAction } from '@/lib/actions/auth.actions';
import type { Profile, Role } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  student: [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/new-request', label: 'New Request', icon: PlusCircle },
    { href: '/student/requests', label: 'My Requests', icon: ClipboardList },
  ],
  maintenance_officer: [
    { href: '/officer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/officer/requests', label: 'My Tasks', icon: Wrench },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/requests', label: 'All Requests', icon: ClipboardList },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/settings', label: 'Site Settings', icon: Settings },
  ],
};

interface SidebarProps {
  profile: Profile & { roles?: { name: Role } };
}

export function Sidebar({ profile }: SidebarProps) {
  const ROLE_MAP: Record<number, Role> = {
    1: 'student',
    2: 'maintenance_officer',
    3: 'admin',
  };
  
  const pathname = usePathname();
  const role = ROLE_MAP[profile.role_id] ?? 'student';
  const navItems = NAV_ITEMS[role] ?? NAV_ITEMS.student;

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    // Force recompile
    <aside className="fixed inset-y-0 left-0 w-64 bg-brand-navy shadow-sidebar z-30 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-brand-coral flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Miva</p>
          <p className="text-white/40 text-xs leading-tight">Maintenance Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-4 mb-2 text-xs font-semibold text-white/30 uppercase tracking-wider">
          {role === 'admin' ? 'Administration' : role === 'maintenance_officer' ? 'My Work' : 'My Account'}
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== `/${role.split('_')[0]}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.href.replace(/\//g, '-').slice(1)}`}
              className={cn('sidebar-nav-item', isActive && 'active')}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User profile + logout */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-coral flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-white/40 text-xs truncate capitalize">
              {role.replace('_', ' ')}
            </p>
          </div>
        </div>
        <form action={signOutAction}>
          <button
            id="btn-signout"
            type="submit"
            className="sidebar-nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
