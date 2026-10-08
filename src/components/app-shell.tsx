"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { PortfolioNotice } from "@/components/portfolio-notice";
import { SiteFooter } from "@/components/site-footer";
import { SignOutControl } from "@/components/sign-out-control";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { email: string; name: string };
  practice?: unknown;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#f2efe9] text-[#281a0d]">
      <PortfolioNotice />
      <header className="sticky top-0 z-50 border-b border-[#d1b996] bg-[#f2efe9]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
          <Link href="/dashboard" className="font-display shrink-0 text-lg">
            EOB Reader
          </Link>
          <nav className="hidden shrink-0 items-center gap-1 sm:flex">
            {links.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className={cn(
                    "inline-flex h-11 items-center rounded-xl px-3 text-sm",
                    active ? "bg-[#eee0c7] text-[#281a0d]" : "text-[#614f38]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-xl px-3 text-sm sm:hidden"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              Menu
            </button>
            <SignOutControl />
          </div>
        </div>
      </header>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[60] sm:hidden">
              <button
                type="button"
                aria-label="Close menu"
                className="absolute inset-0 bg-[#281a0d]/40"
                onClick={() => setOpen(false)}
              />
              <nav className="absolute right-3 top-16 w-56 rounded-2xl border border-[#d1b996] bg-[#f2efe9] p-2 shadow-lg">
                <p className="px-3 py-2 text-xs text-[#614f38]">{user.email}</p>
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-xl px-3 text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>,
            document.body
          )
        : null}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
