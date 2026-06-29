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
      <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-3 sm:gap-3">
        <div className="flex-1 min-w-0 mt-1 sm:mt-0">
          <p className="text-xs sm:text-sm font-medium text-brand-gray mb-1 leading-tight">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-brand-navy">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium',
                trend.positive ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              {trend.positive ? '+' : ''}{trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
            iconColor === 'text-brand-coral' && 'bg-brand-coral/10',
            iconColor === 'text-blue-500' && 'bg-blue-50',
            iconColor === 'text-emerald-500' && 'bg-emerald-50',
            iconColor === 'text-purple-500' && 'bg-purple-50',
            iconColor === 'text-amber-500' && 'bg-amber-50',
          )}
        >
          <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6', iconColor)} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
