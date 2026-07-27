'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CachedImageProps {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

function isOptimizableSrc(src: string): boolean {
  if (src.startsWith('/')) return true;
  try {
    const url = new URL(src);
    return (
      url.hostname.endsWith('supabase.co') ||
      url.hostname === 'lh3.googleusercontent.com' ||
      url.hostname === 'api.mapbox.com'
    );
  } catch {
    return false;
  }
}

/**
 * Optimized image wrapper. Uses next/image when the host is allowlisted;
 * falls back to a single native img otherwise (no double-download preload).
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  src,
  alt,
  fallback,
  className,
  fill = true,
  width,
  height,
  sizes = '(max-width: 768px) 100vw, 480px',
  priority = false,
  onClick,
}) => {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-zinc-800',
          className,
        )}
        onClick={onClick}
      >
        {fallback || (
          <span className="text-sm text-zinc-500">{alt || 'Image'}</span>
        )}
      </div>
    );
  }

  if (!isOptimizableSrc(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onClick={onClick}
        onError={() => setError(true)}
      />
    );
  }

  if (fill) {
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        onClick={onClick}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 400}
      height={height ?? 400}
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
      onClick={onClick}
      onError={() => setError(true)}
    />
  );
};
