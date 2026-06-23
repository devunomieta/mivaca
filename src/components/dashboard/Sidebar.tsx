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
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  Code2,
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
    { href: '/profile', label: 'My Profile', icon: User },
  ],
  maintenance_officer: [
    { href: '/officer', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/officer/requests', label: 'My Tasks', icon: Wrench },
    { href: '/profile', label: 'My Profile', icon: User },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/requests', label: 'All Requests', icon: ClipboardList },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/settings', label: 'Site Settings', icon: Settings },
    { href: '/api/docs', label: 'API Reference', icon: Code2 },
    { href: '/profile', label: 'My Profile', icon: User },
  ],
};

interface SidebarProps {
  profile: Profile & { roles?: { name: Role } };
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  logoUrl?: string;
}

export function Sidebar({ profile, isCollapsed = false, onToggleCollapse, logoUrl }: SidebarProps) {
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
    <aside className="w-full h-full bg-brand-navy shadow-sidebar z-30 flex flex-col relative transition-all duration-300">
      
      {/* Collapse Toggle Button (Desktop Only) */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 bg-brand-coral rounded-full items-center justify-center text-white shadow-md hover:bg-brand-coral-hover transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {/* Logo */}
      <div className={cn("flex items-center border-b border-white/10 transition-all duration-300", isCollapsed ? "justify-center py-5" : "gap-3 px-6 py-5")}>
        <div className="w-9 h-9 rounded-lg bg-brand-coral flex items-center justify-center shrink-0 overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-5 h-5 text-white" strokeWidth={2} />
          )}
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <p className="text-white font-bold text-sm leading-tight">Miva</p>
            <p className="text-white/40 text-xs leading-tight">Maintenance Portal</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden", isCollapsed ? "px-2" : "px-3")}>
        {!isCollapsed && (
          <p className="px-4 mb-2 text-xs font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap">
            {role === 'admin' ? 'Administration' : role === 'maintenance_officer' ? 'My Work' : 'My Account'}
          </p>
        )}
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const roleBasePath = role === 'maintenance_officer' ? '/officer' : `/${role}`;
          const isActive = pathname === item.href || (item.href !== roleBasePath && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg transition-all duration-200 group relative',
                isActive 
                  ? 'bg-brand-coral/10 text-brand-coral font-medium' 
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
                isCollapsed ? 'justify-center p-3 mb-1' : 'gap-3 px-4 py-2.5'
              )}
            >
              <Icon className={cn("flex-shrink-0 transition-colors", isCollapsed ? "w-5 h-5" : "w-4 h-4")} strokeWidth={2} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 bg-brand-navy border border-white/10 text-white text-xs px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile + logout */}
      <div className={cn("border-t border-white/10 transition-all duration-300", isCollapsed ? "p-2" : "p-4")}>
        <div className={cn("flex items-center mb-2", isCollapsed ? "justify-center p-2" : "gap-3 px-2 py-2")}>
          <div className="w-8 h-8 rounded-full bg-brand-coral flex items-center justify-center text-white text-xs font-bold flex-shrink-0 z-10">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile.full_name}</p>
              <p className="text-white/40 text-xs truncate capitalize">
                {role.replace('_', ' ')}
              </p>
            </div>
          )}
        </div>
        
        <form action={signOutAction}>
          <button
            type="submit"
            className={cn(
              'flex items-center text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full group relative',
              isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-2.5'
            )}
          >
            <LogOut className={cn("flex-shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} strokeWidth={2} />
            {!isCollapsed && <span>Sign Out</span>}
            
            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                Sign Out
              </div>
            )}
          </button>
        </form>
      </div>
      
    </aside>
  );
}
