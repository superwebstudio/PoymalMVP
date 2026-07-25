"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.ReactElement {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    document.documentElement.classList.toggle("app-phone-shell", !isAdmin);
  }, [isAdmin]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return <div className="app-shell">{children}</div>;
}
