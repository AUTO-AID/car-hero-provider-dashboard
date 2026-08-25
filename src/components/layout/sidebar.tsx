"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { ChevronRight, LogOut, PanelRightClose, PanelRightOpen, X } from "lucide-react";

import { useAuth } from "@/application/contexts/auth-context";
import { useShell } from "@/application/contexts/shell-context";
import { useRealTimeNotification } from "@/components/providers/notification-alert-provider";
import { prefetchProviderRouteData } from "@/application/services/prefetch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NAV_GROUPS, isRouteActive, routeByHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { AvailabilityToggle } from "./availability-toggle";

/**
 * مؤشّر الاتصال — يعكس حالة السوكِت الفعلية.
 * كانت الشارة تكتب "LIVE" ثابتةً مهما كان الاتصال منقطعاً، وهو أسوأ من غياب
 * المؤشّر: يطمئن المزوّد إلى أنه يستقبل الطلبات وهو لا يستقبلها.
 */
function ConnectionBadge({ collapsed }: { collapsed: boolean }) {
  const { isConnected } = useRealTimeNotification();
  const label = isConnected ? "متصل — الطلبات تصل فوراً" : "غير متصل — جارٍ إعادة المحاولة";

  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold",
        isConnected
          ? "border-success/25 bg-success/10 text-success-soft"
          : "border-warning/25 bg-warning/10 text-warning-soft"
      )}
    >
      <span className={cn("size-1.5 rounded-full", isConnected ? "bg-success" : "bg-warning")} aria-hidden />
      {!collapsed && <span>{isConnected ? "متصل" : "منقطع"}</span>}
    </span>
  );
}

interface NavContentProps {
  navLabel: string;
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  onWarmRoute: (href: string) => void;
}

function NavContent({ navLabel, pathname, collapsed, onNavigate, onWarmRoute }: NavContentProps) {
  const { provider, logout } = useAuth();
  const initials = (provider?.name || provider?.businessName || "م").charAt(0).toUpperCase();

  return (
    <>
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2 border-b border-border/60",
          collapsed ? "justify-center px-2" : "px-4"
        )}
      >
        {collapsed ? (
          <ConnectionBadge collapsed />
        ) : (
          <>
            <Image
              src="/logo_carHero.png"
              alt="كار هيرو"
              width={112}
              height={36}
              className="h-9 w-[112px] shrink-0 object-contain"
              priority
            />
            <span className="flex-1" />
            <ConnectionBadge collapsed={false} />
          </>
        )}
      </div>

      <nav aria-label={navLabel} className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="mb-2 px-2 text-[11px] font-bold text-muted-foreground">{group.group}</p>
            )}
            <ul className="space-y-1">
              {group.hrefs.map((href) => {
                const route = routeByHref(href);
                if (!route) return null;
                const active = isRouteActive(href, pathname);

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      onMouseEnter={() => onWarmRoute(href)}
                      onFocus={() => onWarmRoute(href)}
                      // aria-current: الطريقة الوحيدة التي يعرف بها قارئ الشاشة
                      // أيّ صفحة معروضة الآن — كانت الحالة النشطة لوناً فقط.
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? route.label : undefined}
                      className={cn(
                        "group relative flex min-h-11 items-center gap-3 rounded-lg text-[13px] font-medium transition-colors",
                        collapsed ? "justify-center px-0" : "px-3",
                        active
                          ? "bg-primary/12 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-2 start-0 w-[3px] rounded-e-full bg-primary" aria-hidden />
                      )}
                      <route.icon className="size-4 shrink-0" aria-hidden />
                      {collapsed ? (
                        <span className="sr-only">{route.label}</span>
                      ) : (
                        <span className="flex-1 truncate">{route.label}</span>
                      )}
                      {!collapsed && active && (
                        <ChevronRight className="size-4 shrink-0 rotate-180 opacity-50" aria-hidden />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-border/60 p-2">
        <AvailabilityToggle collapsed={collapsed} />

        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2",
            collapsed && "justify-center border-transparent bg-transparent p-0"
          )}
        >
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-foreground">
                  {provider?.name || provider?.businessName || "المزوّد"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">مزوّد خدمة</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={logout}
                aria-label="تسجيل الخروج"
                title="تسجيل الخروج"
                className="text-muted-foreground hover:bg-danger/10 hover:text-danger-soft"
              >
                <LogOut aria-hidden />
              </Button>
            </>
          )}
        </div>

        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            className="w-full text-muted-foreground hover:bg-danger/10 hover:text-danger-soft"
          >
            <LogOut aria-hidden />
          </Button>
        )}
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSidebarCollapsed, toggleSidebar, isMobileNavOpen, closeMobileNav } = useShell();
  const warmedRoutesRef = useRef(new Set<string>());
  const drawerRef = useRef<HTMLElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  /* حبس التركيز داخل درج الجوال.
     كان الدرج مجرّد <aside> يظهر فوق الصفحة: يستطيع مستخدم الكيبورد أن يخرج
     منه إلى محتوى محجوب بصرياً خلف الطبقة، ولا يعود التركيز إلى مكانه عند
     الإغلاق، ولا يعلن قارئ الشاشة أنه في نافذة منفصلة. */
  useEffect(() => {
    if (!isMobileNavOpen) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;
    const focusables = () =>
      Array.from(
        drawer?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((element) => element.offsetParent !== null);

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileNav();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const restoreFocusTo = lastFocusedRef.current;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusTo?.focus();
    };
  }, [isMobileNavOpen, closeMobileNav]);

  const warmRoute = useCallback(
    (href: string) => {
      if (href === pathname || warmedRoutesRef.current.has(href)) return;

      // كان هذا معطّلاً في التطوير لأن `next dev --webpack` كان يصرّف المسار
      // كاملاً عند كل مرور فوق رابطه (٢٧ ثانية لِـ /finance وحدها). مع
      // Turbopack صار التصريف أقلّ من ثانية، فعاد التسخين إلى العمل في
      // التطوير أيضاً — وهو بالضبط ما يجعل النقرة التالية فورية.
      warmedRoutesRef.current.add(href);
      router.prefetch(href);

      const prefetchData = () => void prefetchProviderRouteData(queryClient, href);
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(prefetchData, { timeout: 2000 });
        return;
      }
      window.setTimeout(prefetchData, 500);
    },
    [pathname, queryClient, router]
  );

  return (
    <>
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-[var(--z-scrim)] bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={closeMobileNav}
          aria-hidden
        />
      )}

      <aside
        ref={drawerRef}
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="قائمة التنقّل"
        aria-hidden={!isMobileNavOpen}
        data-open={isMobileNavOpen}
        className={cn(
          "nav-drawer fixed inset-y-0 start-0 z-[var(--z-drawer)] flex w-[280px] flex-col border-e border-border bg-card shadow-elev-3 lg:hidden",
          !isMobileNavOpen && "pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={closeMobileNav}
          aria-label="إغلاق القائمة"
          className="absolute top-4 end-3 z-10 text-muted-foreground"
        >
          <X aria-hidden />
        </Button>
        <NavContent
          navLabel="التنقّل الرئيسي"
          pathname={pathname}
          collapsed={false}
          onNavigate={closeMobileNav}
          onWarmRoute={warmRoute}
        />
      </aside>

      <aside
        aria-label="الشريط الجانبي"
        className={cn(
          "fixed inset-y-0 start-0 z-[var(--z-sidebar)] hidden flex-col border-e border-border bg-card transition-[width] duration-300 lg:flex",
          isSidebarCollapsed ? "w-[76px]" : "w-[264px]"
        )}
      >
        <NavContent navLabel="التنقّل الجانبي" pathname={pathname} collapsed={isSidebarCollapsed} onWarmRoute={warmRoute} />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? "توسيع الشريط الجانبي" : "طيّ الشريط الجانبي"}
          title={isSidebarCollapsed ? "توسيع الشريط الجانبي" : "طيّ الشريط الجانبي"}
          className="absolute top-1/2 -end-3.5 hidden -translate-y-1/2 rounded-full border border-border bg-card text-muted-foreground shadow-elev-2 hover:bg-secondary hover:text-foreground lg:flex"
        >
          {isSidebarCollapsed ? <PanelRightClose aria-hidden /> : <PanelRightOpen aria-hidden />}
        </Button>
      </aside>
    </>
  );
}
