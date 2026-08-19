"use client";

import Link from "next/link";
import { ArrowLeft, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface OverviewAlertsProps {
  isApproved: boolean;
  activeServicesCount: number;
}

/**
 * تنبيهات قابلة للتنفيذ فقط.
 *
 * كانت البطاقة تعرض دائماً ثلاثة صناديق ملوّنة، اثنان منها نصّ تسويقي ثابت
 * ("الحساب معتمد"، "يمكنك متابعة الإيرادات من قسم الأرباح") لا يتغيّر أبداً
 * ولا يطلب شيئاً — فتعلّم المزوّد تجاهل المنطقة كلّها، بما فيها التنبيه الحقيقي.
 */
export function OverviewAlerts({ isApproved, activeServicesCount }: OverviewAlertsProps) {
  const alerts = [
    !isApproved && {
      key: "approval",
      icon: Clock,
      tone: "border-warning/25 bg-warning/5 text-warning-soft",
      title: "الحساب قيد المراجعة",
      body: "وثائقك قيد التدقيق من إدارة كار هيرو. سيصلك إشعار فور التفعيل.",
      href: "/settings",
      cta: "مراجعة الوثائق",
    },
    activeServicesCount === 0 && {
      key: "services",
      icon: Zap,
      tone: "border-primary/25 bg-primary/5 text-primary",
      title: "لم تُسجّل أي خدمة بعد",
      body: "لن يظهر نشاطك للعملاء قبل إضافة خدمة واحدة على الأقل وتحديد سعرها.",
      href: "/services",
      cta: "إضافة خدمة",
    },
  ].filter(Boolean) as Array<{
    key: string;
    icon: typeof Clock;
    tone: string;
    title: string;
    body: string;
    href: string;
    cta: string;
  }>;

  if (alerts.length === 0) return null;

  return (
    <Card className="gap-0">
      <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
        {alerts.map((alert) => (
          <Link
            key={alert.key}
            href={alert.href}
            className={`group flex items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-secondary/40 ${alert.tone}`}
          >
            <alert.icon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{alert.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{alert.body}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold">
                {alert.cta}
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
