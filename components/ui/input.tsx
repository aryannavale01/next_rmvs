import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-semibold text-foreground block">{label}</label>}
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors',
          error && 'border-destructive focus:ring-destructive/30 focus:border-destructive',
          className
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        aria-required={props.required}
        {...props}
      />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={errorId} className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
  error?: string;
}

export function Select({ label, options, className, id, placeholder, error, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${selectId}-error` : undefined;
  const normalizedOptions = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={selectId} className="text-sm font-semibold text-foreground block">{label}</label>}
      <select
        id={selectId}
        className={cn(
          'w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none',
          error && 'border-destructive focus:ring-destructive/30 focus:border-destructive',
          className
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {normalizedOptions.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p id={errorId} className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  );
}
