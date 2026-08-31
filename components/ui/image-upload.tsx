'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from '@/lib/admin-stepup';

const CMS_IMAGES_ACTION = 'manage_cms_images';
const RETURN_PATH = '/admin/website-content';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function ImageUpload({ value, onChange, label = 'Image', disabled }: ImageUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (!(await requireStepUpClient(RETURN_PATH, CMS_IMAGES_ACTION))) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/cms-images/upload', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (isStepUpRequiredResponse(res.status, data?.error)) {
          redirectToStepUp(RETURN_PATH, CMS_IMAGES_ACTION);
          return;
        }
        throw new Error(data?.error || 'Upload failed');
      }
      if (data?.url) onChange(data.url);
      toast({ title: 'Image Uploaded', description: 'Your image has been uploaded successfully.', variant: 'success' });
    } catch (e: any) {
      toast({ title: 'Upload Failed', description: e?.message || 'Could not upload image. Please try again.', variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = '';
        }}
      />
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-16 h-16 object-cover rounded-lg border border-border bg-muted" />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary rounded-lg hover:bg-primary-light disabled:opacity-50 transition-all"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading...' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled || uploading}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-destructive border border-destructive rounded-lg hover:bg-destructive-bg disabled:opacity-50 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center justify-center gap-2 w-full min-h-[64px] px-4 py-3 text-xs font-semibold text-muted-foreground border border-dashed border-border rounded-lg hover:bg-primary-light hover:text-primary transition-all disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          {uploading ? `Uploading ${label.toLowerCase()}...` : `Upload ${label.toLowerCase()}`}
        </button>
      )}
    </div>
  );
}
