import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-brand-coral',
  trend,
  className,
}: StatsCardProps) {
  return (
    <div className={cn('stat-card animate-slide-up', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-brand-gray mb-1">{title}</p>
          <p className="text-3xl font-bold text-brand-navy">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-xs mt-2 font-medium',
                trend.positive ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              {trend.positive ? '+' : ''}{trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center bg-brand-coral/10',
            iconColor === 'text-brand-coral' && 'bg-brand-coral/10',
            iconColor === 'text-blue-500' && 'bg-blue-50',
            iconColor === 'text-emerald-500' && 'bg-emerald-50',
            iconColor === 'text-purple-500' && 'bg-purple-50',
            iconColor === 'text-amber-500' && 'bg-amber-50',
          )}
        >
          <Icon className={cn('w-6 h-6', iconColor)} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
