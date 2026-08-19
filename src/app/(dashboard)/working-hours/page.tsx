"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Clock, Copy, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageToolbar } from "@/components/ui/page-header";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { formatNumber } from "@/lib/format";
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
    <div className="max-w-3xl space-y-5 animate-fade-in">
      <PageToolbar status={`${formatNumber(activeDays)} أيام نشطة من أصل 7`} />

      {repairedLegacyData && (
        <p role="status" className="flex gap-2 rounded-lg border border-warning/25 bg-warning/5 p-3 text-xs leading-relaxed text-warning-soft">
          <AlertCircle className="size-4 shrink-0" aria-hidden /> بيانات الدوام المحفوظة غير مكتملة. عُرض جدول افتراضي سليم؛ راجعه ثم احفظه لتصحيح السجل.
        </p>
      )}

      <Card className="gap-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base"><Clock className="size-4 text-primary" aria-hidden /> جدول الأسبوع</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={applyToOpenDays}><Copy aria-hidden /> نسخ التوقيت</Button>
        </CardHeader>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="space-y-3">
            {DAYS.map(({ id, label }) => <DayRow key={id} day={label} config={hours[id]} error={errors[id]} onToggle={() => update(id, { isClosed: !hours[id].isClosed })} onTimeChange={(field, value) => update(id, { [field]: value })} />)}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-5">
            <p className="text-xs" aria-live="polite">
              {Object.keys(errors).length ? (
                <span className="font-semibold text-danger-soft">صحّح الأوقات المعلَّمة قبل الحفظ.</span>
              ) : isDirty ? (
                <span className="text-warning-soft">لديك تعديلات غير محفوظة.</span>
              ) : (
                <span className="text-muted-foreground">الجدول محفوظ ومتزامن.</span>
              )}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={!isDirty || mutation.isPending} onClick={() => setHours(initialHours)}>
                <RotateCcw aria-hidden /> تراجع
              </Button>
              <Button
                type="button"
                disabled={!isDirty || Boolean(Object.keys(errors).length)}
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {!mutation.isPending && <Save aria-hidden />} حفظ التعديلات
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

function Loading() { return <LoadingState label="جارٍ تحميل جدول الدوام…" />; }
function LoadError({ retry }: { retry: () => void }) { return <ErrorState title="تعذّر تحميل جدول الدوام" onRetry={retry} />; }
