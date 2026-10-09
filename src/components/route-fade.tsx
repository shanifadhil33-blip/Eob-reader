"use client";

import { usePathname } from "next/navigation";

export function RouteFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  );
}
