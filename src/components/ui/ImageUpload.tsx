'use client';

import { useState, useRef, useTransition } from 'react';
import { toast } from 'sonner';
import { UploadCloud, Loader2, X } from 'lucide-react';
import { uploadFileAction } from '@/lib/actions/storage.actions';
import Image from 'next/image';

interface ImageUploadProps {
  name: string;
  defaultValue?: string;
  bucket: 'assets' | 'avatars';
  label?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  className?: string;
}

export function ImageUpload({ name, defaultValue, bucket, label, aspectRatio = 'auto', className = '' }: ImageUploadProps) {
  const [url, setUrl] = useState(defaultValue || '');
  const [isPending, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    startUpload(async () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);

      const result = await uploadFileAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        setUrl(result.url);
        toast.success('Image uploaded successfully');
      }
      
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const aspectClass = aspectRatio === 'square' ? 'aspect-square max-w-[160px]' : 
                      aspectRatio === 'video' ? 'aspect-video' : 'h-32';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Hidden input to store the actual URL for form submission */}
      <input type="hidden" name={name} value={url} />
      
      <div className={`relative border-2 border-dashed border-border rounded-xl bg-brand-canvas flex flex-col items-center justify-center overflow-hidden group hover:border-brand-coral transition-colors ${aspectClass}`}>
        
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={url} 
              alt="Preview" 
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-brand-navy px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-brand-canvas transition-colors"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => setUrl('')}
                className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center p-6 text-brand-gray hover:text-brand-coral transition-colors"
          >
            <UploadCloud className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">{label || 'Click to upload image'}</span>
            <span className="text-xs mt-1 opacity-70">JPEG, PNG, WEBP (max 5MB)</span>
          </button>
        )}

        {isPending && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 text-brand-coral animate-spin mb-2" />
            <span className="text-sm font-medium text-brand-navy">Uploading...</span>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp, image/gif, image/svg+xml"
        className="hidden"
      />
    </div>
  );
}
