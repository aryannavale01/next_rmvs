import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  pressable?: boolean;
  variant?: 'default' | 'primary' | 'warning' | 'destructive';
}

const cardVariantStyles = {
  default: 'border-border',
  primary: 'border-primary/20 bg-primary-light/5',
  warning: 'border-warning/20 bg-warning-bg/30',
  destructive: 'border-destructive/20 bg-destructive-bg/20',
};

export function Card({ className, children, pressable, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border rounded-xl',
        cardVariantStyles[variant],
        pressable && 'cursor-pointer hover:shadow-md hover:border-primary/30 transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4 border-b border-border', className)} {...props}>{children}</div>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props}>{children}</div>;
}
