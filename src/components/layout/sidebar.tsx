"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/application/contexts/auth-context";
import { cn } from "@/lib/utils";
import { prefetchProviderRouteData } from "@/application/services/prefetch";
import {
  LayoutDashboard, Wrench, Calendar,
  Settings, LogOut, ChevronLeft,
  Wallet, X, Menu, Clock,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useCallback, useEffect, useRef } from "react";

const navItems = [
  {
    group: "الرئيسية",
    items: [
      { href: "/",              icon: LayoutDashboard, label: "لوحة القيادة" },
      { href: "/orders",        icon: Calendar,        label: "الطلبات والمواعيد" },
    ],
  },
  {
    group: "الخدمات",
    items: [
      { href: "/services",      icon: Wrench,  label: "خدماتي وأسعاري" },
      { href: "/working-hours", icon: Clock,   label: "أوقات الدوام" },
    ],
  },
  {
    group: "الحساب",
    items: [
      { href: "/finance",   icon: Wallet,   label: "الأرباح والمحفظة" },
      { href: "/settings",  icon: Settings, label: "إعدادات الحساب" },
    ],
  },
];

/* ─────────────────────────────────────────────────
   NavContent extracted OUTSIDE Sidebar so React never
   unmounts/remounts it on route changes.
───────────────────────────────────────────────── */
interface NavContentProps {
  pathname: string;
  admin: { name?: string; businessName?: string } | null;
  logout: () => void;
  onWarmRoute: (href: string) => void;
}

function NavContent({ pathname, admin, logout, onWarmRoute }: NavContentProps) {
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initials = (admin?.name || admin?.businessName || "م")
    .charAt(0)
    .toUpperCase();

  return (
    <>
      {/* ── Logo bar ── */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/20 shrink-0">
        <img
          src="/logo_carHero.png"
          alt="Car Hero"
          className="h-10 w-[128px] shrink-0 object-contain drop-shadow-[0_5px_16px_rgba(143,92,177,0.28)]"
        />

        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium tracking-wide">
            بوابة المزود
          </p>
        </div>

        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/15 rounded-full px-2 py-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase">Live</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navItems.map((group) => (
          <div key={group.group}>
            <p className="px-3 mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/30">
              {group.group}
            </p>

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => onWarmRoute(item.href)}
                      onFocus={() => onWarmRoute(item.href)}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-colors duration-150",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground/70 hover:text-foreground hover:bg-secondary/60"
                      )}
                    >
                      {active && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-[55%] rounded-l-full bg-primary shadow-[0_0_8px_hsl(275_36%_52%/0.7)]" />
                      )}

                      <item.icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors duration-150",
                          active
                            ? "text-primary"
                            : "text-muted-foreground/40 group-hover:text-muted-foreground"
                        )}
                        aria-hidden
                      />

                      <span className="flex-1 truncate">{item.label}</span>

                      {active && (
                        <ChevronLeft className="w-3 h-3 text-primary/50 shrink-0" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Divider ── */}
      <div className="mx-4 h-px bg-border/20" />

      {/* ── User profile ── */}
      <div className="p-3 shrink-0">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/30 border border-border/20 hover:bg-secondary/60 hover:border-border/40 transition-colors duration-150 group cursor-default">
          <Avatar className="h-8 w-8 border border-primary/20 shadow-sm shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-primary/25 to-primary/8 text-primary text-xs font-black">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-foreground truncate leading-none">
              {admin?.name || admin?.businessName || "المزود"}
            </p>
            <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">
              مزود خدمة
            </p>
          </div>

          <button
            onClick={logout}
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors duration-150 opacity-0 group-hover:opacity-100"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────
   Sidebar shell — only handles mobile open/close state
───────────────────────────────────────────────── */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { admin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const warmedRoutesRef = useRef(new Set<string>());

  useEffect(() => {
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  const warmRoute = useCallback((href: string) => {
    if (href === pathname || warmedRoutesRef.current.has(href)) return;

    // Disable prefetching on hover in development to prevent overloading the server with compilation & API requests
    if (process.env.NODE_ENV === "development") return;

    warmedRoutesRef.current.add(href);
    router.prefetch(href);

    const prefetchData = () => {
      void prefetchProviderRouteData(queryClient, href);
    };

    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(prefetchData, { timeout: 2000 });
      return;
    }

    window.setTimeout(prefetchData, 500);
  }, [pathname, queryClient, router]);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="فتح القائمة"
        className="fixed top-3.5 right-3.5 z-[60] lg:hidden bg-card/90 backdrop-blur-md border border-border/40 rounded-xl p-2.5 shadow-xl text-foreground hover:bg-secondary/80 transition-colors"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[55] bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[58] flex flex-col bg-card/95 backdrop-blur-2xl border-l border-border/30 transition-transform duration-300 ease-out w-[264px] shadow-2xl lg:hidden",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="إغلاق القائمة"
          className="absolute top-4 left-4 p-1.5 rounded-lg text-muted-foreground/50 hover:bg-secondary/60 hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <NavContent pathname={pathname} admin={admin} logout={logout} onWarmRoute={warmRoute} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 right-0 z-50 flex-col w-[var(--sidebar-width)] bg-card/75 backdrop-blur-2xl border-l border-border/20 shadow-xl">
        <NavContent pathname={pathname} admin={admin} logout={logout} onWarmRoute={warmRoute} />
      </aside>
    </>
  );
}
