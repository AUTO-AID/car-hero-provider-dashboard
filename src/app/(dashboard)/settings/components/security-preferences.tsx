"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, LogOut, Smartphone, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/application/contexts/auth-context";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { NotificationPreferences, updateAccountPreferences } from "@/infrastructure/services/profile.service";

export function SecurityPreferences({ phone, isVerified, initialPreferences }: { phone: string; isVerified: boolean; initialPreferences: NotificationPreferences }) {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [soundEnabled, setSoundEnabled] = useState(() => typeof window === "undefined" || localStorage.getItem("provider_order_sound_enabled") !== "false");
  const mutation = useMutation({
    mutationFn: (next: NotificationPreferences) => updateAccountPreferences({ language: "ar", notifications: next }),
    onSuccess: async (_result, next) => {
      setPreferences(next);
      toast.success("تم حفظ تفضيلات التنبيه.");
      await queryClient.invalidateQueries({ queryKey: providerQueryKeys.account });
    },
    onError: () => toast.error("تعذر حفظ تفضيلات التنبيه."),
  });
  const change = (key: keyof NotificationPreferences, enabled: boolean) => mutation.mutate({ ...preferences, [key]: enabled });
  const changeSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem("provider_order_sound_enabled", String(enabled));
    toast.success("تم حفظ إعداد الصوت لهذا الجهاز.");
  };

  return (
    <div className="space-y-5">
      <Card className="glass-v2 border-border/30 rounded-lg overflow-hidden">
        <CardHeader className="border-b border-border/20 bg-secondary/10">
          <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> تفضيلات التنبيهات</CardTitle>
          <CardDescription className="text-xs">تحفظ قنوات التواصل في حسابك، ويمكن تعطيل تنبيهات الشاشة الفورية.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          <Preference title="تنبيهات الشاشة الفورية" description="استقبال إشعارات الطلبات والتحديثات عبر لوحة المزود." checked={preferences.push} disabled={mutation.isPending} onChange={(checked) => change("push", checked)} />
          <Preference title="رسائل الهاتف" description="تفضيل محفوظ لاستخدامه عند تفعيل قناة الرسائل في النظام." checked={preferences.sms} disabled={mutation.isPending} onChange={(checked) => change("sms", checked)} />
          <Preference title="رسائل البريد الإلكتروني" description="تفضيل محفوظ للتقارير والإشعارات البريدية عند تفعيل القناة." checked={preferences.email} disabled={mutation.isPending} onChange={(checked) => change("email", checked)} />
          <Preference title="صوت الطلبات الجديدة على هذا الجهاز" description="يتحكم بصوت التنبيه المحلي داخل هذا المتصفح فقط." checked={soundEnabled} disabled={false} onChange={changeSound} icon={Volume2} />
        </CardContent>
      </Card>

      <Card className="glass-v2 border-border/30 rounded-lg overflow-hidden">
        <CardHeader className="border-b border-border/20 bg-secondary/10">
          <CardTitle className="text-base flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary" /> الوصول والأمان</CardTitle>
          <CardDescription className="text-xs">يعتمد الدخول على رقم الهاتف الموثق. لا تعرض الصفحة جلسات غير متاحة من الخادم.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 border border-border/25 rounded-lg bg-secondary/10">
            <span dir="ltr" className="text-sm font-bold">{phone || "غير متوفر"}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${isVerified ? "text-emerald-400" : "text-amber-400"}`}><CheckCircle2 className="w-3.5 h-3.5" /> {isVerified ? "موثق" : "بانتظار التوثيق"}</span>
          </div>
          <Button type="button" variant="outline" onClick={logout} className="gap-2 text-rose-400 border-rose-500/20 hover:bg-rose-500/10"><LogOut className="w-4 h-4" /> تسجيل الخروج من هذا الجهاز</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Preference({ title, description, checked, disabled, onChange, icon: Icon = Bell }: { title: string; description: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void; icon?: typeof Bell }) {
  return <div className="flex items-center justify-between gap-4 p-3 border border-border/25 rounded-lg bg-secondary/5"><div className="flex gap-2"><Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" /><div><h3 className="text-xs font-bold">{title}</h3><p className="text-[10px] text-muted-foreground mt-1">{description}</p></div></div><Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={title} /></div>;
}
