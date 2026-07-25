"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Stale time: how long data is considered fresh
                        staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 min
                        // Cache time (gcTime): how long unused data stays in cache
                        gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache for 24h
                        // Retry failed requests
                        retry: 2,
                        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                        // Refetch on window focus (optional - can disable for better UX)
                        refetchOnWindowFocus: false,
                        // Refetch on reconnect
                        refetchOnReconnect: true,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}



















