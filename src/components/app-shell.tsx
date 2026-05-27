"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  LayoutDashboard,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import type { Practice } from "@/lib/extraction/types";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    email: string;
    name: string;
    avatarUrl?: string;
  };
  practice: Practice | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: Clock },
  { href: "/guide", label: "Guide", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children, user, practice }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 flex selection:bg-black selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-black/5 bg-white/80 backdrop-blur-3xl shadow-sm z-10">
        {/* Logo */}
        <div className="p-6 border-b border-black/5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/logo.png" alt="EOB Reader" width={32} height={32} className="rounded-lg shadow-md" />
            <span className="text-lg font-extrabold text-black tracking-tight">
              EOB Reader
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group duration-300",
                  isActive
                    ? "bg-black text-white shadow-md shadow-black/10"
                    : "text-black/60 hover:text-black hover:bg-black/5"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-black/40 group-hover:text-black/80")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Subscription Status */}
        {practice && (() => {
          const daysRemaining = Math.max(
            0,
            Math.ceil(
              (new Date(practice.trial_end_date).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          );
          const isExpiredTrial = practice.subscription_status === "trial" && daysRemaining <= 0;
          const isActiveTrial = practice.subscription_status === "trial" && daysRemaining > 0;

          if (practice.subscription_status === "pro") {
            return (
              <div className="p-4 mx-4 mb-4 rounded-xl bg-orange-50 border border-orange-100 shadow-sm">
                <p className="text-xs text-orange-600 font-bold flex items-center gap-1">
                  ⭐ Pro Plan
                </p>
                <p className="text-xs text-orange-600/60 font-medium">Unlimited uploads</p>
              </div>
            );
          }

          if (isActiveTrial) {
            return (
              <div className="p-4 mx-4 mb-4 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
                <p className="text-xs text-emerald-700 font-bold mb-1">
                  Free Trial
                </p>
                <p className="text-xs text-emerald-700/70 font-medium">
                  {daysRemaining} days remaining
                </p>
              </div>
            );
          }

          if (isExpiredTrial || practice.subscription_status === "expired" || practice.subscription_status === "canceled") {
            return (
              <Link
                href="/settings"
                className="block p-4 mx-4 mb-4 rounded-xl bg-red-50 border border-red-100 shadow-sm hover:border-red-200 hover:bg-red-100/50 transition-colors"
              >
                <p className="text-xs text-red-600 font-bold mb-1">
                  {isExpiredTrial ? "Trial Expired" : practice.subscription_status === "canceled" ? "Canceled" : "Expired"}
                </p>
                <p className="text-xs text-red-600/70 font-medium flex items-center justify-between">
                  1 PDF/day
                  <span className="font-bold underline tracking-tighter">Upgrade</span>
                </p>
              </Link>
            );
          }

          return null;
        })()}

        {/* User Menu */}
        <div className="p-4 border-t border-black/5 bg-gray-50/50">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-black/5 transition-colors text-left border border-transparent shadow-sm hover:border-black/5 hover:shadow-md bg-white">
                <Avatar className="w-8 h-8 ring-1 ring-black/5">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  <AvatarFallback className="bg-black/5 text-black text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black truncate">
                    {user.name}
                  </p>
                  <p className="text-xs font-medium text-black/50 truncate">
                    {user.email}
                  </p>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white border border-black/10 shadow-2xl rounded-xl p-2"
            >
              <DropdownMenuItem
                className="text-black/70 hover:text-black hover:bg-black/5 focus:bg-black/5 focus:text-black cursor-pointer font-medium rounded-lg"
                onClick={() => router.push("/settings")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-black/5 my-1" />
              <DropdownMenuItem
                className="text-red-500 hover:text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600 cursor-pointer font-medium rounded-lg"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="EOB Reader" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-extrabold text-black tracking-tight">EOB Reader</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-black/60 hover:bg-black/5 hover:text-black"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
        {mobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-1 border-t border-black/5 pt-2 bg-white">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all group",
                    isActive
                      ? "bg-black text-white shadow-md shadow-black/10"
                      : "text-black/60 hover:text-black hover:bg-black/5"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-black/40 group-hover:text-black")} />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 mt-2 border-t border-black/5">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:overflow-auto relative">
        {/* Subtle background ambient gradient in the main content area */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-indigo-50/50 rounded-bl-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-50/50 rounded-tr-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 md:p-8 p-4 pt-20 md:pt-8 min-h-screen max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
