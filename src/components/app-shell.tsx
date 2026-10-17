"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Gamepad2,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { NAV_SECTIONS, findNavItem } from "@/components/nav-config";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/hooks/use-session";
import { apiFetch } from "@/lib/client-api";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25">
        <Gamepad2 className="size-5 text-white" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">JB COC</p>
        <p className="text-[11px] text-muted-foreground">Sales Dashboard</p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-1.5">
          <p className="px-3 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase">
            {section.label}
          </p>
          {section.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-violet-500/12 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-violet-500"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    active ? "text-violet-400" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {item.title}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const { session } = useSession();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      toast.success("Berhasil keluar");
      router.replace("/login");
    } catch {
      toast.error("Gagal keluar, coba lagi");
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-2.5">
        <Avatar className="size-9 ring-1 ring-violet-500/30">
          <AvatarFallback className="bg-violet-500/15 text-xs font-semibold text-violet-300">
            {initials(session?.email ?? "JB")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">Admin</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {session?.email ?? "memuat..."}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        <LogOut className="size-4" />
        {loggingOut ? "Keluar..." : "Keluar"}
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = findNavItem(pathname);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col justify-between border-r border-white/5 bg-sidebar p-4 lg:flex">
        <div className="flex flex-col gap-7">
          <div className="px-2 pt-1">
            <Brand />
          </div>
          <NavLinks />
        </div>
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-white/5 bg-sidebar p-4 lg:hidden"
            >
              <div className="flex flex-col gap-7">
                <div className="flex items-center justify-between px-2 pt-1">
                  <Brand />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Tutup menu"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <SidebarFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/5 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">
              {current?.title ?? "JB COC Dashboard"}
            </h1>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {current?.description ?? "Manajemen penjualan akun Clash of Clans"}
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:flex">
            <ShieldCheck className="size-3.5" />
            Google Sheets
          </div>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Muat ulang"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
          </Button>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>

        <Separator className="opacity-0" />
        <footer className="px-4 pb-8 text-center text-xs text-muted-foreground sm:px-6">
          JB COC Sales Management Dashboard · Data tersimpan aman di Google Sheets
        </footer>
      </div>
    </div>
  );
}
