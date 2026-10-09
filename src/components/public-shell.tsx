"use client";

import { PortfolioNotice } from "@/components/portfolio-notice";
import { PublicHeader } from "@/components/public-header";
import { RouteFade } from "@/components/route-fade";
import { SiteFooter } from "@/components/site-footer";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f2efe9] text-[#281a0d]">
      <PortfolioNotice />
      <PublicHeader />
      <RouteFade>{children}</RouteFade>
      <SiteFooter />
    </div>
  );
}
