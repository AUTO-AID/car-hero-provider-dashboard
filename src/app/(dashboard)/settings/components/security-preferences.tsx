"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Bell,
  Smartphone,
  CheckCircle2,
  Laptop,
} from "lucide-react";

interface SecurityPreferencesProps {
  phone: string;
}

export function SecurityPreferences({ phone }: SecurityPreferencesProps) {
  const [notifPreferences, setNotifPreferences] = useState({
    newOrderSound: true,
    whatsappUpdates: true,
    weeklyReportEmail: false,
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("provider_notif_prefs");
      if (saved) {
        try {
          setNotifPreferences(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const saveNotifications = (updated: typeof notifPreferences) => {
    setNotifPreferences(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("provider_notif_prefs", JSON.stringify(updated));
    }
    toast.success("تم حفظ إعدادات التنبيهات بنجاح");
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Notification settings */}
      <Card className="glass-v2 border border-border/30 rounded-2xl overflow-hidden shadow-xl">
        <CardHeader className="pb-4 border-b border-border/20 bg-secondary/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-primary" />
            </span>
            تفضيلات التنبيهات والإشعارات
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground font-medium">
            تخصيص كيفية استلام إشعارات الحجز الجديد والتحديثات المالية
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/25 bg-secondary/5">
            <div>
              <h4 className="text-xs font-bold text-foreground">تنبيهات صوتية فورية للطلبات</h4>
              <p className="text-[10px] text-muted-foreground mt-1">
                إطلاق صوت رنين مستمر عند استقبال طلب حجز جديد في التطبيق لتفادي ضياع الطلب
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                saveNotifications({
                  ...notifPreferences,
                  newOrderSound: !notifPreferences.newOrderSound,
                })
              }
              className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 outline-none ${
                notifPreferences.newOrderSound ? "bg-primary" : "bg-border/40"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                  notifPreferences.newOrderSound ? "right-5.5" : "right-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/25 bg-secondary/5">
            <div>
              <h4 className="text-xs font-bold text-foreground">إشعارات الواتساب المباشرة</h4>
              <p className="text-[10px] text-muted-foreground mt-1">
                استقبال تقارير وتحديثات فورية للرحلات والتسويات المالية مباشرة على الواتساب الشخصي
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                saveNotifications({
                  ...notifPreferences,
                  whatsappUpdates: !notifPreferences.whatsappUpdates,
                })
              }
              className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 outline-none ${
                notifPreferences.whatsappUpdates ? "bg-primary" : "bg-border/40"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                  notifPreferences.whatsappUpdates ? "right-5.5" : "right-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/25 bg-secondary/5">
            <div>
              <h4 className="text-xs font-bold text-foreground">التقارير المالية الأسبوعية بالبريد</h4>
              <p className="text-[10px] text-muted-foreground mt-1">
                إرسال كشف حساب مفصل أسبوعياً للأرباح والعمولات المقتطعة على بريدك الإلكتروني المسجل
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                saveNotifications({
                  ...notifPreferences,
                  weeklyReportEmail: !notifPreferences.weeklyReportEmail,
                })
              }
              className={`w-11 h-6 rounded-full transition-all duration-300 relative shrink-0 outline-none ${
                notifPreferences.weeklyReportEmail ? "bg-primary" : "bg-border/40"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                  notifPreferences.weeklyReportEmail ? "right-5.5" : "right-0.5"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Phone info & Session */}
      <Card className="glass-v2 border border-border/30 rounded-2xl overflow-hidden shadow-xl">
        <CardHeader className="pb-4 border-b border-border/20 bg-secondary/10">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-3.5 h-3.5 text-primary" />
            </span>
            توثيق الأجهزة والوصول للأمان
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground/80">رقم الهاتف المسجل والنشط</label>
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/20 bg-secondary/5">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold tracking-wider" dir="ltr">
                  {phone || "غير متوفر"}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                موثق بنجاح
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-border/10">
            <h4 className="text-xs font-bold text-muted-foreground/80 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-primary/60" />
              الجلسات النشطة حالياً
            </h4>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/20 bg-secondary/5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-primary shrink-0">
                  <Laptop className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">متصفح Chrome على نظام Windows</p>
                  <p className="text-[9px] text-muted-foreground/80 mt-0.5">
                    دمشق، سوريا • الجلسة الحالية
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-500">نشط الآن</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
