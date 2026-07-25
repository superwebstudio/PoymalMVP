"use client";

import { Crown } from "lucide-react";

interface ProAvatarBadgeProps {
  size?: "sm" | "md";
}

/** Small gold crown overlaid on the bottom-right of an avatar (PRO). */
export function ProAvatarBadge({ size = "sm" }: ProAvatarBadgeProps) {
  const badgeSize = size === "md" ? "h-6 w-6" : "h-4 w-4";
  const iconSize = size === "md" ? 12 : 9;
  const border = size === "md" ? "border-2" : "border-[1.5px]";

  return (
    <div
      className={`absolute -bottom-0.5 -right-0.5 flex ${badgeSize} items-center justify-center rounded-full ${border} border-zinc-900 bg-amber-500 shadow-sm`}
      title="PRO"
      aria-label="PRO"
    >
      <Crown
        size={iconSize}
        className="text-zinc-950"
        fill="currentColor"
        strokeWidth={2}
      />
    </div>
  );
}
