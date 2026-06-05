'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMediaUploadProps {
  threadId: string;
  onClose: () => void;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string | null;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_SIZE_MB = 10;

export function ChatMediaUpload({ threadId, onClose }: ChatMediaUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported file type`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `"${file.name}" exceeds ${MAX_SIZE_MB}MB limit`;
    }
    return null;
  }, []);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: UploadingFile[] = [];

      Array.from(fileList).forEach((file) => {
        const error = validateFile(file);
        const isImage = file.type.startsWith('image/');

        newFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: isImage ? URL.createObjectURL(file) : null,
          progress: 0,
          status: error ? 'error' : 'uploading',
          error: error || undefined,
        });
      });

      setFiles((prev) => [...prev, ...newFiles]);

      // Simulate uploads for non-error files
      newFiles.forEach((uf) => {
        if (uf.status === 'error') return;

        const simulateUpload = async () => {
          try {
            const formData = new FormData();
            formData.append('file', uf.file);

            // Simulate progress
            for (let p = 0; p <= 90; p += 15) {
              await new Promise((r) => setTimeout(r, 100));
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uf.id ? { ...f, progress: p } : f
                )
              );
            }

            // Actual upload
            const res = await fetch(
              `/api/chat/threads/${threadId}/media`,
              {
                method: 'POST',
                body: formData,
              }
            );

            if (!res.ok) throw new Error('Upload failed');

            setFiles((prev) =>
              prev.map((f) =>
                f.id === uf.id
                  ? { ...f, progress: 100, status: 'done' }
                  : f
              )
            );
          } catch {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uf.id
                  ? { ...f, status: 'error', error: 'Upload failed' }
                  : f
              )
            );
          }
        };

        simulateUpload();
      });
    },
    [threadId, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const allDone = files.length > 0 && files.every((f) => f.status === 'done');

  return (
    <div className="p-4 space-y-3">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all',
          isDragging
            ? 'border-[var(--preone-primary)] bg-[var(--preone-primary-50)] scale-[1.01]'
            : 'border-[var(--border-default)] bg-[var(--bg-secondary)] hover:border-[var(--preone-primary)]/50 hover:bg-[var(--bg-tertiary)]'
        )}
      >
        <div
          className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
            isDragging
              ? 'bg-[var(--preone-primary)]/10'
              : 'bg-[var(--bg-tertiary)]'
          )}
        >
          <Upload
            className={cn(
              'h-6 w-6 transition-colors',
              isDragging
                ? 'text-[var(--preone-primary)]'
                : 'text-[var(--text-muted)]'
            )}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {isDragging ? 'Drop files here' : 'Upload files'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Images, PDFs, Documents · Max {MAX_SIZE_MB}MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              processFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                file.status === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-default)]'
              )}
            >
              {/* Thumbnail / Icon */}
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-[var(--text-muted)]" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-xs font-medium truncate',
                    file.status === 'error'
                      ? 'text-red-700'
                      : 'text-[var(--text-primary)]'
                  )}
                >
                  {file.file.name}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {(file.file.size / 1024).toFixed(1)} KB
                </p>
                {file.status === 'uploading' && (
                  <Progress
                    value={file.progress}
                    className="h-1 mt-1.5 rounded-full"
                  />
                )}
                {file.status === 'error' && (
                  <p className="text-[10px] text-red-500 mt-0.5">
                    {file.error}
                  </p>
                )}
              </div>

              {/* Status icon */}
              <div className="shrink-0">
                {file.status === 'done' ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--preone-green)]" />
                ) : file.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : null}
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-lg"
                onClick={() => removeFile(file.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Actions */}
      {allDone && (
        <div className="flex justify-end">
          <Button
            size="sm"
            className="rounded-xl bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-blue)] text-white"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
