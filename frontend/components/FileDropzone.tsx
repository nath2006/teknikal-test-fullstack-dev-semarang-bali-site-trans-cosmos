'use client';
import { Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export function FileDropzone({ onFile }: { onFile: (file: File) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ multiple: false, onDrop: ([file]) => file && onFile(file) });
  return <div {...getRootProps()} className="cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-soft">
    <input {...getInputProps()} />
    <Upload className="mx-auto mb-2 h-6 w-6 text-brand-600" />
    <p className="text-sm font-medium">{isDragActive ? 'Drop file here' : 'Drag and drop attachment here'}</p>
    <p className="mt-1 text-xs text-slate-500">Images, documents, or videos up to backend limit.</p>
  </div>;
}
