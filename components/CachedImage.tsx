"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    fallback?: string;
}

/**
 * CachedImage component that uses React Query to cache images
 * Images are cached for 7 days to prevent re-downloading
 * The browser's native cache is used, React Query just tracks the cache state
 */
export const CachedImage: React.FC<CachedImageProps> = ({
    src,
    alt,
    fallback,
    className,
    ...props
}) => {
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Use React Query to track image loading state and cache status
    const { data: imageLoaded } = useQuery({
        queryKey: ['image', src],
        queryFn: async () => {
            // Preload the image to ensure it's in browser cache
            return new Promise<boolean>((resolve, reject) => {
                if (!src) {
                    reject(new Error('No src provided'));
                    return;
                }
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = src;
            });
        },
        staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - images don't change often
        gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days garbage collection
        retry: 2,
        retryDelay: 1000,
        enabled: !!src && !error,
    });

    useEffect(() => {
        if (imageLoaded) {
            setIsLoading(false);
        }
    }, [imageLoaded]);

    const handleError = () => {
        setError(true);
        setIsLoading(false);
    };

    const handleLoad = () => {
        setIsLoading(false);
    };

    if (!src || error) {
        return (
            <div
                className={`bg-zinc-800 flex items-center justify-center ${className || ''}`}
                {...(props as any)}
            >
                {fallback || (
                    <span className="text-zinc-500 text-sm">{alt || 'Image'}</span>
                )}
            </div>
        );
    }

    return (
        <>
            {isLoading && (
                <div
                    className={`bg-zinc-800 animate-pulse flex items-center justify-center ${className || ''}`}
                    style={{ minHeight: props.height || '200px' }}
                />
            )}
            <img
                src={src}
                alt={alt}
                className={className}
                onLoad={handleLoad}
                onError={handleError}
                style={{
                    display: isLoading ? 'none' : 'block',
                    ...props.style,
                }}
                loading="lazy"
                {...props}
            />
        </>
    );
};

