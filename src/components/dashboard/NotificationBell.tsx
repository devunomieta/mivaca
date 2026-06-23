'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();

    const channel = supabase.channel('realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        // Fetch the user ID to ensure we only show notifications meant for them
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user && payload.new.user_id === user.id) {
            setNotifications(prev => [payload.new, ...prev]);
            toast('New Notification', { description: payload.new.message });
          }
        });
      })
      .subscribe();

    const interval = setInterval(fetchNotifications, 60000); // Polling fallback
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.data) setNotifications(json.data);
    } catch (e) {
      console.error('Failed to fetch notifications');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id?: string) => {
    try {
      const payload = id ? { id } : { markAllRead: true };
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      setNotifications(prev => prev.map(n => 
        (id ? n.id === id : true) ? { ...n, is_read: true } : n
      ));
    } catch (e) {
      toast.error('Failed to mark notification read');
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-brand-canvas transition-colors outline-none focus:ring-2 focus:ring-brand-coral focus:ring-offset-2">
          <Bell className="w-5 h-5 text-brand-navy" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 border-border rounded-xl shadow-card mt-2">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-brand-canvas/50 rounded-t-xl">
          <h3 className="font-semibold text-brand-navy">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={(e) => { e.preventDefault(); markAsRead(); }}
              className="text-xs text-brand-coral hover:text-brand-coral-hover font-medium flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>
        
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-brand-gray text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <DropdownMenuItem 
                  key={notif.id} 
                  className={`p-4 flex flex-col gap-1 items-start focus:bg-brand-canvas outline-none cursor-pointer ${!notif.is_read ? 'bg-brand-canvas/30' : ''}`}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!notif.is_read) markAsRead(notif.id);
                    if (notif.link) window.location.href = notif.link;
                  }}
                >
                  <div className="flex justify-between items-start w-full gap-2">
                    <p className={`text-sm font-medium ${!notif.is_read ? 'text-brand-navy' : 'text-brand-gray'}`}>
                      {notif.title}
                    </p>
                    {!notif.is_read && <span className="w-2 h-2 rounded-full bg-brand-coral shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-brand-gray line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-brand-gray/60 mt-1 font-mono uppercase">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
