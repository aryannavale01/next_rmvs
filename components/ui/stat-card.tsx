import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'destructive' | 'neutral';
  className?: string;
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-primary-light text-primary',
  success: 'bg-success-bg text-success-text',
  warning: 'bg-warning-bg text-warning-text',
  destructive: 'bg-destructive-bg text-destructive-text',
  neutral: 'bg-primary-light/50 text-muted-foreground',
};

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-5 w-1/2 rounded" />
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, variant = 'primary', className = '', loading }: StatCardProps) {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className={cn('bg-card border border-border rounded-xl p-4 flex items-center gap-3 transition-all hover:shadow-sm', className)}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', variantStyles[variant])}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
