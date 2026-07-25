"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TelegramBackButtonProps {
    onClick?: () => void;
    fallbackUrl?: string;
}

export function TelegramBackButton({ onClick, fallbackUrl }: TelegramBackButtonProps) {
    const router = useRouter();

    useEffect(() => {
        // Check if running in Telegram Web App
        if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
            return;
        }

        const tg = window.Telegram.WebApp;

        // Show Telegram BackButton
        if (tg.BackButton) {
            tg.BackButton.show();

            const handleBack = () => {
                if (onClick) {
                    onClick();
                } else {
                    // Use browser history to go back to previous page
                    // This will work correctly with Next.js client-side navigation
                    router.back();
                }
            };

            tg.BackButton.onClick(handleBack);

            // Cleanup on unmount
            return () => {
                if (tg.BackButton) {
                    tg.BackButton.offClick(handleBack);
                    tg.BackButton.hide();
                }
            };
        }
    }, [onClick, fallbackUrl, router]);

    // Return null - Telegram BackButton is rendered by Telegram SDK
    return null;
}


