"use client";

import { Bell, Search, CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

/* ── Page metadata map ── */
const pageTitles: Record<string, { title: string; desc: string; icon: string }> = {
  "/":              { title: "لوحة القيادة",      desc: "نظرة عامة على أداء نشاطك",       icon: "🏠" },
  "/orders":        { title: "الطلبات والمواعيد",  desc: "متابعة وإدارة طلبات العملاء",    icon: "📋" },
  "/services":      { title: "خدماتي وأسعاري",    desc: "إدارة الخدمات المقدمة وأسعارها", icon: "🔧" },
  "/working-hours": { title: "أوقات الدوام",       desc: "تحديد ساعات العمل اليومية",      icon: "🕐" },
  "/finance":       { title: "الأرباح والمحفظة",   desc: "المعاملات المالية ورصيد المحفظة", icon: "💰" },
  "/settings":      { title: "إعدادات الحساب",    desc: "إدارة معلومات ملفك الشخصي",      icon: "⚙️" },
};

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const pathname = usePathname();
  const page = pageTitles[pathname] ?? pageTitles["/"];
  const [notifCount] = useState(3);
  const [searchFocused, setSearchFocused] = useState(false);

  const now = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-[68px] items-center justify-between border-b border-border/20 bg-background/70 px-4 sm:px-6 backdrop-blur-2xl gap-4">

      {/* ── Left: page identity ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* emoji icon badge */}
        <div className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl bg-primary/8 border border-primary/15 text-lg shrink-0 select-none">
          {page.icon}
        </div>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-[15px] font-bold tracking-tight text-foreground truncate leading-none">
            {page.title}
          </h1>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5 font-medium hidden sm:block truncate">
            {page.desc}
          </p>
        </div>
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Date pill */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-muted-foreground/50 bg-secondary/30 border border-border/20 rounded-lg px-3 py-1.5 whitespace-nowrap">
          <CalendarDays className="w-3 h-3 shrink-0 text-primary/50" />
          <span>{now}</span>
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors",
              searchFocused ? "text-primary/60" : "text-muted-foreground/30"
            )}
            aria-hidden
          />
          <Input
            placeholder="بحث سريع..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "h-8 bg-secondary/30 border-border/20 text-xs pr-9 rounded-lg placeholder:text-muted-foreground/25 transition-all duration-300",
              searchFocused ? "w-56 border-primary/30 bg-secondary/60" : "w-40"
            )}
          />
        </div>

        {/* Refresh (optional) */}
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            title="تحديث البيانات"
            className="h-8 w-8 rounded-lg hover:bg-secondary/60 text-muted-foreground/50 hover:text-foreground"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </Button>
        )}

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            title={`${notifCount} إشعارات جديدة`}
            className="h-8 w-8 rounded-lg hover:bg-secondary/60 text-muted-foreground/50 hover:text-foreground"
          >
            <Bell className="w-3.5 h-3.5" />
          </Button>

          {notifCount > 0 && (
            <span className="absolute -top-0.5 -left-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground px-1 shadow-md shadow-primary/40 pointer-events-none animate-scale-in">
              {notifCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
