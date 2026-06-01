"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Clock, Copy, Loader2, RefreshCw, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkingHourItem } from "@/domain/entities/provider.types";
import { getProviderProfile, updateProviderWorkingHours } from "@/infrastructure/services/profile.service";
import { DayConfig, DayRow } from "./components/day-row";

type HoursMap = Record<string, DayConfig>;
const DAYS = [
  { id: "Sunday", label: "الأحد" },
  { id: "Monday", label: "الإثنين" },
  { id: "Tuesday", label: "الثلاثاء" },
  { id: "Wednesday", label: "الأربعاء" },
  { id: "Thursday", label: "الخميس" },
  { id: "Friday", label: "الجمعة" },
  { id: "Saturday", label: "السبت" },
] as const;
const defaults = (): HoursMap => Object.fromEntries(DAYS.map(({ id }) => [id, { open: "08:00", close: "18:00", isClosed: id === "Friday" }]));

export default function WorkingHoursPage() {
  const query = useQuery({ queryKey: providerQueryKeys.profile, queryFn: getProviderProfile });
  if (query.isLoading) return <Loading />;
  if (query.isError) return <LoadError retry={() => void query.refetch()} />;
  const normalized = normalizeHours(query.data?.workingHours);
  return <ScheduleEditor key={JSON.stringify(normalized.hours)} initialHours={normalized.hours} repairedLegacyData={normalized.repairedLegacyData} />;
}

function ScheduleEditor({ initialHours, repairedLegacyData }: { initialHours: HoursMap; repairedLegacyData: boolean }) {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState(initialHours);
  const errors = useMemo(() => validate(hours), [hours]);
  const isDirty = JSON.stringify(hours) !== JSON.stringify(initialHours);
  const activeDays = DAYS.filter(({ id }) => !hours[id].isClosed).length;
  const mutation = useMutation({
    mutationFn: () => updateProviderWorkingHours(toArray(hours)),
    onSuccess: async () => {
      toast.success("تم حفظ جدول الدوام.");
      await queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
    },
    onError: () => toast.error("تعذر حفظ الجدول. راجع الأوقات وحاول مجدداً."),
  });
  const update = (day: string, patch: Partial<DayConfig>) => setHours((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
  const applyToOpenDays = () => {
    const source = DAYS.find(({ id }) => !hours[id].isClosed)?.id;
    if (!source) return toast.warning("فعّل يوماً واحداً على الأقل أولاً.");
    setHours((current) => Object.fromEntries(DAYS.map(({ id }) => [id, current[id].isClosed ? current[id] : { ...current[id], open: current[source].open, close: current[source].close }])));
    toast.success("تم نسخ التوقيت إلى الأيام المفعلة.");
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"><Clock className="w-5 h-5 text-primary" /></span>
        <div><h1 className="text-2xl font-black tracking-tight">أوقات الدوام</h1><p className="text-sm text-muted-foreground mt-0.5"><span className="text-primary font-bold">{activeDays}</span> أيام نشطة من أصل 7</p></div>
      </div>

      {repairedLegacyData && <p className="flex gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400"><AlertCircle className="w-4 h-4 shrink-0" /> بيانات الدوام القديمة غير مكتملة. عُرض جدول افتراضي سليم؛ راجعه ثم احفظه لتصحيح السجل.</p>}

      <Card className="glass-v2 border-border/30 rounded-lg overflow-hidden">
        <CardHeader className="border-b border-border/20 bg-secondary/10 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> جدول الأسبوع</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={applyToOpenDays} className="gap-1.5"><Copy className="w-3.5 h-3.5" /> نسخ التوقيت</Button>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {DAYS.map(({ id, label }) => <DayRow key={id} day={label} config={hours[id]} error={errors[id]} onToggle={() => update(id, { isClosed: !hours[id].isClosed })} onTimeChange={(field, value) => update(id, { [field]: value })} />)}
          <div className="pt-4 border-t border-border/20 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">{Object.keys(errors).length ? "صحح الأوقات المعلّمة قبل الحفظ." : isDirty ? "لديك تعديلات غير محفوظة." : "الجدول محفوظ ومتزامن."}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={!isDirty || mutation.isPending} onClick={() => setHours(initialHours)} className="gap-1.5"><RotateCcw className="w-4 h-4" /> تراجع</Button>
              <Button type="button" disabled={!isDirty || Boolean(Object.keys(errors).length) || mutation.isPending} onClick={() => mutation.mutate()} className="gap-1.5">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ التعديلات
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeHours(items?: WorkingHourItem[]) {
  const hours = defaults();
  if (!items?.length) return { hours, repairedLegacyData: false };
  let valid = 0;
  items.forEach((item) => {
    if (DAYS.some(({ id }) => id === item.day) && /^\d{2}:\d{2}$/.test(item.open) && /^\d{2}:\d{2}$/.test(item.close)) {
      hours[item.day] = { open: item.open, close: item.close, isClosed: Boolean(item.isClosed) };
      valid += 1;
    }
  });
  return { hours, repairedLegacyData: valid !== 7 };
}

function validate(hours: HoursMap) {
  return Object.fromEntries(DAYS.flatMap(({ id }) => {
    const item = hours[id];
    return !item.isClosed && item.open >= item.close ? [[id, "وقت الإغلاق يجب أن يكون بعد وقت الافتتاح."]] : [];
  }));
}

function toArray(hours: HoursMap): WorkingHourItem[] {
  return DAYS.map(({ id }) => ({ day: id, ...hours[id] }));
}

function Loading() { return <div className="min-h-[55vh] flex items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin text-primary" /> جاري تحميل جدول الدوام...</div>; }
function LoadError({ retry }: { retry: () => void }) { return <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3 text-center"><AlertCircle className="w-7 h-7 text-rose-400" /><p className="text-sm font-bold">تعذر تحميل جدول الدوام</p><Button onClick={retry} className="gap-2"><RefreshCw className="w-4 h-4" /> إعادة المحاولة</Button></div>; }
