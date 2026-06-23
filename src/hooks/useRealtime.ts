'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RequestStatus } from '@/types';

interface UseRealtimeOptions {
  requestId?: string;
  onStatusChange?: (newStatus: RequestStatus) => void;
  onNewRequest?: () => void;
}

export function useRealtime({ requestId, onStatusChange, onNewRequest }: UseRealtimeOptions) {
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    if (requestId && onStatusChange) {
      // Subscribe to a specific request's status changes
      channelRef.current = supabase
        .channel(`request-${requestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'service_requests',
            filter: `id=eq.${requestId}`,
          },
          (payload) => {
            const newRecord = payload.new as { status: RequestStatus };
            if (newRecord?.status) {
              onStatusChange(newRecord.status);
            }
          }
        )
        .subscribe();
    } else if (onNewRequest) {
      // Subscribe to any new request inserts (admin/officer view)
      channelRef.current = supabase
        .channel('new-requests')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'service_requests',
          },
          () => {
            onNewRequest();
          }
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [requestId, onStatusChange, onNewRequest]);
}
