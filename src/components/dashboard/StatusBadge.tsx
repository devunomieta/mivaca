import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RequestStatus, RequestPriority } from '@/types';

// -----------------------------------------------
// Status Badge
// -----------------------------------------------
const STATUS_CONFIG: Record<RequestStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
  },
};

const PRIORITY_CONFIG: Record<RequestPriority, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
  },
  critical: {
    label: 'CRITICAL',
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100 font-bold animate-pulse',
  },
};

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: '' };
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium border', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: RequestPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? { label: priority, className: '' };
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium border', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
