"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortfolioNotice } from "@/components/portfolio-notice";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <PortfolioNotice />
      <nav className="border-b border-black/5 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2">
          <Image
            src="/logo.png"
            alt="EOB Reader"
            width={28}
            height={28}
            className="shrink-0 rounded-xl shadow-md shadow-black/10 sm:h-[32px] sm:w-[32px]"
          />
          <span className="truncate text-base font-bold tracking-tight text-black sm:text-lg md:text-xl">
            EOB Reader
          </span>
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button
              variant="ghost"
              className="h-auto px-4 py-1.5 text-sm font-medium text-black/60 transition-colors hover:bg-black/5 hover:text-black"
            >
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="h-auto rounded-full border border-black/10 bg-white px-5 py-1.5 text-sm font-medium text-black shadow-sm transition-all hover:bg-black/5 hover:shadow-md">
              <span className="flex items-center gap-2">
                <GoogleIcon />
                Sign in with Google
              </span>
            </Button>
          </Link>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-black/60 hover:bg-black/5 hover:text-black md:hidden"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="space-y-2 border-t border-black/5 bg-white px-4 pb-4 pt-3 md:hidden">
          <Link
            href="/login"
            className="block"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Button
              variant="ghost"
              className="h-auto w-full justify-start px-3 py-3 text-sm font-medium text-black/60 hover:bg-black/5 hover:text-black"
            >
              Log in
            </Button>
          </Link>
          <Link
            href="/signup"
            className="block"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Button className="h-auto w-full rounded-full border border-black/10 bg-white px-3 py-3 text-sm font-medium text-black hover:bg-black/5">
              <span className="flex items-center justify-center gap-2">
                <GoogleIcon />
                Sign in with Google
              </span>
            </Button>
          </Link>
        </div>
      )}
      </nav>
    </div>
  );
}
