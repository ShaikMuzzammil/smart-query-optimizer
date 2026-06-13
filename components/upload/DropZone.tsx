'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export default function DropZone({ onFiles, disabled }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) onFiles(acceptedFiles);
    },
    [onFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-2xl p-10 sm:p-16 text-center cursor-pointer transition-all ${
        isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-ring hover:bg-elevated/40'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="w-14 h-14 rounded-2xl bg-elevated flex items-center justify-center mx-auto mb-4 text-primary">
        <UploadCloud className="w-6 h-6" />
      </div>
      <p className="font-display font-semibold text-ink mb-1">
        {isDragActive ? 'Drop files to upload' : 'Drag & drop files here, or click to browse'}
      </p>
      <p className="text-sm text-ink-muted">Supports .txt, .md, .pdf, .docx — up to 10MB per file</p>
    </div>
  );
}
