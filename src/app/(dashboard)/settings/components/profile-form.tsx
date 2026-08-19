"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Mail, MapPin, Save, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProviderProfile } from "@/infrastructure/services/profile.service";
import { Field } from "@/components/ui/field";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ProfileData {
  businessName: string;
  ownerName: string;
  email: string;
  address: string;
  city: string;
  description: string;
}

export function ProfileForm({ initialData }: { initialData: ProfileData }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(initialData);
  const normalized = useMemo(() => normalize(formData), [formData]);
  const isDirty = JSON.stringify(normalized) !== JSON.stringify(normalize(initialData));
  // الأخطاء تظهر تحت الحقل نفسه بدل toast يختفي قبل أن يعرف المستخدم أيّ حقل يقصد
  const errors = {
    businessName: normalized.businessName.length > 0 && normalized.businessName.length < 2 ? "حرفان على الأقل." : undefined,
    ownerName: normalized.ownerName.length > 0 && normalized.ownerName.length < 2 ? "حرفان على الأقل." : undefined,
    city: normalized.city.length > 0 && normalized.city.length < 2 ? "حرفان على الأقل." : undefined,
    email: normalized.email && !EMAIL_PATTERN.test(normalized.email) ? "صيغة البريد الإلكتروني غير صحيحة." : undefined,
  };
  const isValid =
    normalized.businessName.length >= 2 &&
    normalized.ownerName.length >= 2 &&
    normalized.city.length >= 2 &&
    !errors.email;
  const mutation = useMutation({
    mutationFn: (data: ProfileData) => {
      const { email, ...payload } = data;
      return updateProviderProfile(email ? { ...payload, email } : payload);
    },
    onSuccess: async () => {
      toast.success("تم حفظ الملف التجاري");
      await queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
    },
    onError: () => toast.error("تعذر حفظ الملف. راجع الحقول وحاول مجدداً."),
  });

  const update = (field: keyof ProfileData, value: string) => setFormData((current) => ({ ...current, [field]: value }));

  return (
    <Card className="gap-0">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-base"><Building className="size-4 text-primary" aria-hidden /> المعلومات الأساسية</CardTitle>
        <CardDescription>تظهر هذه البيانات للعملاء عند عرض نشاطك وخدماتك.</CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={(event) => { event.preventDefault(); if (isValid) mutation.mutate(normalized); }} className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="اسم النشاط التجاري" icon={Building} required error={errors.businessName}>
              <Input value={formData.businessName} onChange={(event) => update("businessName", event.target.value)} maxLength={120} />
            </Field>
            <Field label="اسم المالك المسؤول" icon={User} required error={errors.ownerName}>
              <Input value={formData.ownerName} onChange={(event) => update("ownerName", event.target.value)} maxLength={120} />
            </Field>
            <Field label="البريد الإلكتروني" icon={Mail} hint="اختياري — يُستخدم للتقارير والإشعارات البريدية." error={errors.email}>
              <Input type="email" dir="ltr" autoComplete="email" value={formData.email} onChange={(event) => update("email", event.target.value)} maxLength={160} />
            </Field>
            <Field label="المدينة أو المحافظة" icon={MapPin} required error={errors.city}>
              <Input value={formData.city} onChange={(event) => update("city", event.target.value)} maxLength={100} />
            </Field>
            <Field label="العنوان التفصيلي" icon={MapPin} full>
              <Input value={formData.address} onChange={(event) => update("address", event.target.value)} maxLength={300} />
            </Field>
            <Field label="وصف النشاط" icon={Building} full hint={`${formData.description.length} / 1000 حرف`}>
              <Textarea className="resize-none" value={formData.description} onChange={(event) => update("description", event.target.value)} maxLength={1000} rows={4} />
            </Field>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-5">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success-soft" aria-hidden /> تُحفظ التعديلات مباشرة في ملف نشاطك.
            </span>
            <Button type="submit" disabled={!isDirty || !isValid} loading={mutation.isPending}>
              {!mutation.isPending && <Save aria-hidden />} حفظ التغييرات
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function normalize(data: ProfileData) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.trim()])) as unknown as ProfileData;
}
