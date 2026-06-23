'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import type { Profile, Role, SiteSettings } from '@/types';

export function DashboardShell({ profile, settings, children }: { profile: Profile & { roles?: { name: Role } }; settings: SiteSettings | null; children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on route change
  useEffect(() => {
    const timeout = setTimeout(() => setIsMobileOpen(false), 0);
    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <div className="flex fixed inset-0 bg-brand-canvas overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-40 lg:hidden transition-opacity" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}
      
      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative transition-all duration-300 ease-in-out shrink-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        <Sidebar 
          profile={profile} 
          isCollapsed={isCollapsed} 
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)} 
          logoUrl={settings?.favicon_url}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Universal Top Header */}
        <div className="h-16 bg-white border-b border-border shadow-sm flex justify-between items-center px-4 sm:px-6 shrink-0 z-30">
          <div className="flex items-center lg:hidden">
            <button 
              onClick={() => setIsMobileOpen(true)} 
              className="p-2 -ml-2 text-brand-navy hover:bg-brand-canvas rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="ml-3 flex items-center gap-2">
              {settings?.favicon_url ? (
                <div className="w-7 h-7 rounded overflow-hidden flex items-center justify-center">
                  <img src={settings.favicon_url} alt="Logo" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded bg-brand-coral" />
              )}
              <span className="font-bold text-sm text-brand-navy shrink-0">Miva Maintenance</span>
            </div>
          </div>
          
          <div className="hidden lg:block" /> {/* Spacer for desktop */}
          
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </div>
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
