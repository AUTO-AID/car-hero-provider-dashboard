"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, LogOut, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/application/contexts/auth-context";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { NotificationPreferences, updateAccountPreferences } from "@/infrastructure/services/profile.service";

export function SecurityPreferences({ phone, isVerified, initialPreferences }: { phone: string; isVerified: boolean; initialPreferences: NotificationPreferences }) {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(initialPreferences);
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

  return (
    <div className="space-y-5">
      <Card className="gap-0">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base"><Bell className="size-4 text-primary" aria-hidden /> تفضيلات التنبيهات</CardTitle>
          <CardDescription>تحفظ قنوات التواصل في حسابك. عروض الطلبات الجديدة تصل إلى تطبيق الفني حصراً ولا تظهر هنا.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-5 sm:p-6">
          <Preference title="تنبيهات الشاشة الفورية" description="استقبال تحديثات الطلبات الجارية في هذه اللوحة. أما عروض الطلبات الجديدة فتصل إلى تطبيق الفني وحده." checked={preferences.push} disabled={mutation.isPending} onChange={(checked) => change("push", checked)} />
          <Preference title="رسائل الهاتف" description="تفضيل محفوظ لاستخدامه عند تفعيل قناة الرسائل في النظام." checked={preferences.sms} disabled={mutation.isPending} onChange={(checked) => change("sms", checked)} />
          <Preference title="رسائل البريد الإلكتروني" description="تفضيل محفوظ للتقارير والإشعارات البريدية عند تفعيل القناة." checked={preferences.email} disabled={mutation.isPending} onChange={(checked) => change("email", checked)} />
        </CardContent>
      </Card>

      <Card className="gap-0">
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base"><Smartphone className="size-4 text-primary" aria-hidden /> الوصول والأمان</CardTitle>
          <CardDescription>يعتمد الدخول على رقم الهاتف الموثق. لا تعرض الصفحة جلسات غير متاحة من الخادم.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 rounded-xl border bg-secondary/30 p-4">
            <span dir="ltr" className="text-sm font-semibold tracking-wider">{phone || "غير متوفر"}</span>
            <Badge variant={isVerified ? "success" : "warning"} className="h-6 rounded-full border px-2.5">
              <CheckCircle2 className="size-3.5" aria-hidden /> {isVerified ? "رقم موثّق" : "بانتظار التوثيق"}
            </Badge>
          </div>
          <div className="pt-2">
            <Button type="button" variant="destructive-soft" onClick={logout} className="w-full sm:w-auto">
              <LogOut aria-hidden /> تسجيل الخروج من هذا الجهاز
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Preference({ title, description, checked, disabled, onChange }: { title: string; description: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  const Icon = Bell;
  return (
    /* التسمية هي منطقة النقر — لا onClick على div خارجي كان يلتقط النقرات
       دون أن يعلن لقارئ الشاشة أنه عنصر تفاعلي */
    <label className="flex cursor-pointer flex-col justify-between gap-4 rounded-xl border bg-secondary/20 p-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center">
      <span className="flex gap-3">
        <span className="h-fit rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-4 shrink-0" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-semibold text-foreground">{title}</span>
          <span className="mt-1 block max-w-[420px] text-xs leading-relaxed text-muted-foreground">{description}</span>
        </span>
      </span>
      <span className="flex justify-end ps-11 sm:ps-0">
        <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={title} />
      </span>
    </label>
  );
}
