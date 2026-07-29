"use client";

import { useRef, useState, type DragEvent } from "react";
import clsx from "clsx";

export function UploadDropzone({
  accept,
  onFile,
  label,
  hint,
  preview,
}: {
  accept: string;
  onFile: (file: File) => void;
  label: string;
  hint?: string;
  preview?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={clsx(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
        isDragging
          ? "border-brand-blue bg-brand-light"
          : "border-border bg-bg hover:border-brand-blue",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Uploaded preview"
          className="max-h-28 max-w-full object-contain"
        />
      ) : (
        <>
          <p className="text-sm font-medium text-text">{label}</p>
          {hint && <p className="text-xs text-muted">{hint}</p>}
        </>
      )}
    </div>
  );
}
