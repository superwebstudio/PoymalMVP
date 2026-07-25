"use client";

import { useState } from 'react';

export function useGestureSheet() {
    const [isOpen, setIsOpen] = useState(false);

    return {
        isOpen,
        setIsOpen,
        handleCloseSheet: () => setIsOpen(false),
        handleOpenSheet: () => setIsOpen(true),
    };
}
