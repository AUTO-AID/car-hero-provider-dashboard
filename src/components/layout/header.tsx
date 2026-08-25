"use client";

import { usePathname } from "next/navigation";
import { CalendarDays, Menu, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useShell } from "@/application/contexts/shell-context";
import { useClientReady } from "@/application/hooks/use-client-ready";
import { formatDate } from "@/lib/format";
import { matchRoute } from "@/lib/routes";
import { NotificationsMenu } from "./notifications-menu";

/**
 * الهيدر هو **المالك الوحيد لعنوان الصفحة**.
 *
 * كان العنوان يظهر مرّتين في كل مسار: هنا وفي رأس مكتوب داخل الصفحة نفسها،
 * فيبتلع نحو 120px من الطية الأولى ويترك في الصفحة عنوانَي `<h1>` يربكان
 * قارئ الشاشة. بيانات المسار تأتي الآن من `lib/routes.ts` نفسه الذي يغذّي
 * الشريط الجانبي، بدل خريطة ثانية بإيموجي وتسميات مختلفة قليلاً.
 */
export function Header() {
  const pathname = usePathname();
  const mounted = useClientReady();
  const { openMobileNav, isMobileNavOpen, refreshAll, isRefreshing } = useShell();

  const route = matchRoute(pathname);
  const today = formatDate(new Date(), "weekday");

  return (
    <header className="sticky top-0 z-[var(--z-header)] flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {/* زرّ القائمة داخل الهيدر: كان زرّاً عائماً بـ z-60 يغطّي عنوان
            الصفحة على الشاشات الصغيرة. */}
        <Button
          variant="ghost"
          size="icon"
          onClick={openMobileNav}
          aria-label="فتح قائمة التنقّل"
          aria-expanded={isMobileNavOpen}
          aria-controls="mobile-nav"
          className="lg:hidden"
        >
          <Menu aria-hidden />
        </Button>

        <span className="hidden size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary sm:flex">
          <route.icon className="size-4" aria-hidden />
        </span>

        <div className="min-w-0">
          <h1 className="truncate text-lg leading-tight font-bold text-foreground">
            {route.title}
          </h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {route.description}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span className="hidden items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs whitespace-nowrap text-muted-foreground xl:flex">
          <CalendarDays className="size-3.5 shrink-0 text-primary" aria-hidden />
          <span suppressHydrationWarning>{mounted ? today : ""}</span>
        </span>

        {/* زرّ تحديث واحد يعمل فعلاً. كان الهيدر يستقبل `onRefresh` ولا يمرّره
            التخطيط أبداً، فصنعت كل صفحة زرّها الخاص. */}
        <Button
          variant="ghost"
          size="icon"
          onClick={refreshAll}
          aria-label="تحديث بيانات اللوحة"
          title="تحديث بيانات اللوحة"
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={isRefreshing ? "animate-spin" : undefined} aria-hidden />
        </Button>

        <NotificationsMenu />
      </div>
    </header>
  );
}
