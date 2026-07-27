const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-warning-bg text-warning-text border border-warning/20',
  Enrolled: 'bg-success-bg text-success-text border border-success/20',
  Completed: 'bg-primary-light text-primary border border-primary/20',
  'Course Completed': 'bg-success-bg text-success-text border border-success/20',
  Dropped: 'bg-destructive-bg text-destructive-text border border-destructive/20',
  generated: 'bg-warning-bg text-warning-text border border-warning/20',
  pending: 'bg-muted text-muted-foreground border border-border',
  accepted: 'bg-success-bg text-success-text border border-success/20',
  Published: 'bg-success-bg text-success-text',
  Draft: 'bg-warning-bg text-warning-text',
  active: 'bg-success-bg text-success-text',
  inactive: 'bg-destructive-bg text-destructive-text',
  suspended: 'bg-warning-bg text-warning-text',
  blocked: 'bg-destructive-bg text-destructive-text',
  deleted: 'bg-muted text-muted-foreground border border-border',
  rejected: 'bg-destructive-bg text-destructive-text border border-destructive/20',
  'Documents Under Verification': 'bg-warning-bg text-warning-text border border-warning/20',
  'Under Review': 'bg-primary-light text-primary border border-primary/20',
  Approved: 'bg-success-bg text-success-text border border-success/20',
};

export function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground border border-border';
}

export { STATUS_STYLES };
