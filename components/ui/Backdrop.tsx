"use client";

import React from 'react';

interface BackdropProps {
    isOpen: boolean;
    onClose: () => void;
    blur?: boolean;
    zIndex?: number;
    pointerEvents?: boolean;
}

export const Backdrop: React.FC<BackdropProps> = ({
    isOpen,
    onClose,
    blur = false,
    zIndex = 40,
    pointerEvents = true,
}) => {
    if (!isOpen) return null;

    return (
        <div
            onClick={pointerEvents ? onClose : undefined}
            className={`fixed inset-0 transition-opacity duration-300 ${pointerEvents ? 'pointer-events-auto' : 'pointer-events-none'}`}
            style={{
                opacity: isOpen ? 1 : 0,
                backgroundColor: isOpen ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)',
                backdropFilter: blur ? 'blur(8px)' : undefined,
                WebkitBackdropFilter: blur ? 'blur(8px)' : undefined,
                zIndex,
                animation: 'fadeIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
        />
    );
};
