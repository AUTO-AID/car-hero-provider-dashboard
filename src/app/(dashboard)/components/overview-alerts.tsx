"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, Zap, TrendingUp, ArrowUpRight } from "lucide-react";

interface OverviewAlertsProps {
  isApproved: boolean;
  activeServicesCount: number;
}

export function OverviewAlerts({ isApproved, activeServicesCount }: OverviewAlertsProps) {
  return (
    <Card className="glass-v2 border border-border/30 rounded-2xl overflow-hidden animate-fade-in">
      <CardHeader className="pb-3 border-b border-border/20">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-primary" />
          </span>
          تنبيهات النظام
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isApproved ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-400">الحساب معتمد ومفعل</p>
              <p className="text-[12px] text-emerald-400/70 mt-0.5">ملفك التجاري مفعل ويظهر للعملاء في تطبيق الهواتف والموقع.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-400">الحساب قيد المراجعة الفنية</p>
              <p className="text-[12px] text-amber-400/70 mt-0.5">الوثائق قيد التدقيق من قِبل إدارة CarHero. سيُرسَل إشعار عند التفعيل.</p>
            </div>
          </div>
        )}
        {activeServicesCount === 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/8 border border-violet-500/20">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-violet-400">قم بإعداد خدماتك</p>
              <p className="text-[12px] text-violet-400/70 mt-0.5">لم تسجل خدمات نشطة بعد. يرجى التوجه لصفحة الخدمات لإضافتها.</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-violet-400/60 shrink-0 mt-1" />
          </div>
        )}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-500/8 border border-sky-500/20">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-sky-400">تتبع أداءك</p>
            <p className="text-[12px] text-sky-400/70 mt-0.5">يمكنك متابعة الإيرادات والطلبات تفصيلياً من قسم الأرباح والمحفظة.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
