"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SignInButton } from "@/components/sign-in-button";
import { useCloseOnEscape } from "@/components/use-close-on-escape";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const links = [
  { href: "/demo", label: "Demo" },
  { href: "/#how", label: "How it works" },
];

export function PublicHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [panelTop, setPanelTop] = useState(64);
  const [signedIn, setSignedIn] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useCloseOnEscape(open, close);

  function openMenu() {
    const bottom = headerRef.current?.getBoundingClientRect().bottom ?? 56;
    setPanelTop(bottom + 8);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onScroll() {
      setOpen(false);
    }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
    });
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-[#d1b996] bg-[#f2efe9]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link href="/" className="inline-flex min-h-11 items-center font-display text-lg text-[#281a0d]">
          EOB Reader
        </Link>
        <nav className="hidden items-center gap-5 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm text-[#614f38] hover:text-[#281a0d]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-11 items-center rounded-xl px-3 text-sm sm:hidden"
            aria-expanded={open}
            onClick={openMenu}
          >
            Menu
          </button>
          {signedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-xl bg-[#416c6f] px-4 text-sm font-medium text-[#f2efe9]"
            >
              Dashboard
            </Link>
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[60] sm:hidden">
              <button
                type="button"
                aria-label="Close menu"
                className="absolute inset-0 bg-[#281a0d]/40"
                onClick={() => setOpen(false)}
              />
              <nav
                className="absolute right-3 w-56 rounded-2xl border border-[#d1b996] bg-[#f2efe9] p-2 shadow-lg"
                style={{ top: panelTop }}
              >
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-xl px-3 text-sm text-[#281a0d]"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}
