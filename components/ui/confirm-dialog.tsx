'use client';

import React, { useRef, useState } from 'react';
import { Modal } from './modal';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  variant?: 'destructive' | 'primary';
  confirmLabel?: string;
  cancelLabel?: string;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'destructive',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  children,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        {children}
        <div className="flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={variant}
            loading={loading}
            loadingText={confirmLabel}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
