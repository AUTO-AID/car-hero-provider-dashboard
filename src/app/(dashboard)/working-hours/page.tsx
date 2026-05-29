"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProviderProfile,
  updateProviderWorkingHours,
} from "@/infrastructure/services/profile.service";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DayRow, DayConfig } from "./components/day-row";

/* ─── Types ─── */
type HoursMap = Record<string, DayConfig>;

const DAYS_ORDER = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const DEFAULT_HOURS: HoursMap = Object.fromEntries(
  DAYS_ORDER.map((d) => [
    d,
    { open: "08:00", close: "18:00", isClosed: d === "الجمعة" },
  ])
);

/* ─── Page ─── */
export default function WorkingHoursPage() {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState<HoursMap>(DEFAULT_HOURS);

  const { data: profileData, isLoading } = useQuery({
    queryKey: providerQueryKeys.profile,
    queryFn: getProviderProfile,
  });

  useEffect(() => {
    if (profileData?.data?.workingHours?.length > 0) {
      const formatted: HoursMap = { ...DEFAULT_HOURS };
      profileData.data.workingHours.forEach(
        (wh: { day: string; open: string; close: string; isClosed: boolean }) => {
          formatted[wh.day] = {
            open: wh.open,
            close: wh.close,
            isClosed: wh.isClosed,
          };
        }
      );
      queueMicrotask(() => setHours(formatted));
    }
  }, [profileData]);

  const updateHoursMut = useMutation({
    mutationFn: (updatedHours: HoursMap) => {
      const workingHoursArray = Object.entries(updatedHours).map(
        ([day, conf]) => ({
          day,
          open: conf.open,
          close: conf.close,
          isClosed: conf.isClosed,
        })
      );
      return updateProviderWorkingHours(workingHoursArray);
    },
    onSuccess: () => {
      toast.success("تم تحديث أوقات الدوام بنجاح");
      queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });

  const handleToggle = (day: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], isClosed: !prev[day].isClosed },
    }));
  };

  const handleTimeChange = (
    day: string,
    field: "open" | "close",
    value: string
  ) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleApplyToAll = () => {
    // Find first day that is not closed (e.g. Sunday or Monday)
    const firstActiveDay = DAYS_ORDER.find((d) => !hours[d].isClosed);
    if (!firstActiveDay) {
      toast.warning("يرجى تفعيل يوم واحد على الأقل أولاً");
      return;
    }
    const { open, close } = hours[firstActiveDay];
    setHours((prev) => {
      const updated = { ...prev };
      DAYS_ORDER.forEach((day) => {
        if (!updated[day].isClosed) {
          updated[day] = { ...updated[day], open, close };
        }
      });
      return updated;
    });
    toast.success(`تم نسخ توقيت ${firstActiveDay} (${open} - ${close}) لكافة الأيام المفعلة`);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse max-w-3xl">
        {/* Page Header Skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border/20" />
          <div className="space-y-2">
            <div className="h-7 w-32 bg-card rounded-md" />
            <div className="h-4 w-40 bg-card/60 rounded-md" />
          </div>
        </div>

        {/* Card Skeleton */}
        <Card className="bg-card/40 border border-border/20 rounded-2xl p-6 space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-16 bg-secondary/20 border border-border/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="h-4 w-28 bg-secondary/40 rounded-md" />
              <div className="h-9 w-48 bg-secondary/20 border border-border/10 rounded-xl flex-1 mx-4" />
              <div className="h-8 w-20 bg-secondary/40 rounded-xl" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  const activeDays = Object.values(hours).filter((d) => !d.isClosed).length;

  return (
    <div className="space-y-8 animate-fade-in-up max-w-3xl">
      {/* ─── Page Header ─── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gradient tracking-tight">
            أوقات الدوام
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            <span className="text-primary font-bold">{activeDays}</span> أيام
            نشطة من أصل {DAYS_ORDER.length}
          </p>
        </div>
      </div>

      {/* ─── Hours Card ─── */}
      <Card className="glass-v2 border border-border/30 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/20 bg-secondary/20 flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-primary" />
            </span>
            تحديد ساعات العمل
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyToAll}
            className="h-8 rounded-lg border-primary/20 hover:bg-primary/10 text-primary text-xs font-bold gap-1.5"
          >
            نسخ التوقيت لجميع الأيام المفعلة
          </Button>
        </CardHeader>

        <CardContent className="p-5 space-y-3">
          {DAYS_ORDER.map((day) => (
            <DayRow
              key={day}
              day={day}
              config={hours[day]}
              onToggle={() => handleToggle(day)}
              onTimeChange={(field, val) => handleTimeChange(day, field, val)}
            />
          ))}

          {/* Save footer */}
          <div className="pt-4 border-t border-border/20 flex items-center justify-between gap-4">
            <p className="text-[11px] text-muted-foreground/40">
              التغييرات لا تُحفظ تلقائياً
            </p>
            <Button
              onClick={() => updateHoursMut.mutate(hours)}
              disabled={updateHoursMut.isPending}
              className="gap-2 px-8 h-11 bg-primary hover:bg-primary/85 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-[1.02] active:scale-100"
            >
              {updateHoursMut.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ التعديلات
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
