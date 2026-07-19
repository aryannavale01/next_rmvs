'use client';

import React from 'react';
import { AlertTriangle, LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: LucideIcon;
  developerError?: string;
  supportAction?: () => void;
  supportLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  icon: Icon = AlertTriangle,
  developerError,
  supportAction,
  supportLabel = 'Contact Support',
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-card border border-destructive/20 rounded-xl max-w-xl mx-auto"
      role="alert"
    >
      <div className="w-16 h-16 rounded-full bg-destructive-bg flex items-center justify-center mb-5 shadow-sm">
        <Icon className="w-7 h-7 text-destructive" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      <div className="flex items-center gap-3">
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {supportAction && (
          <Button variant="secondary" onClick={supportAction}>
            {supportLabel}
          </Button>
        )}
      </div>
      {developerError && process.env.NODE_ENV === 'development' && (
        <div className="mt-6 w-full">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {showDetails ? 'Hide details' : 'Show error details'}
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 bg-background border border-border rounded-lg text-xs text-left text-muted-foreground overflow-auto max-h-32">
              {developerError}
            </pre>
          )}
        </div>
      )}
    </motion.div>
  );
}
