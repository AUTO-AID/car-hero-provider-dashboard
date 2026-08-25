"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Phone, Save, Store, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProviderProfile } from "@/infrastructure/services/profile.service";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ProfileData {
  businessName: string;
  ownerName: string;
  email: string;
  address: string;
  city: string;
  description: string;
}

/**
 * الملف الشخصي: بطاقتان بدل جدار حقول واحد.
 *
 * كانت ستّة حقول متلاصقة تحت عنوان واحد («المعلومات الأساسية») بلا تجميع،
 * والتسميات بقياس 13px رمادية باهتة تُقرأ أخفت من قيم الحقول نفسها.
 * الآن: ترويسة تُري المزوّد كيف يظهر نشاطه للعميل، ثمّ مجموعتان بعنوانين
 * يقولان ما فيهما — «نشاطك» و«أين تجدك».
 */
export function ProfileForm({ initialData, phone }: { initialData: ProfileData; phone?: string }) {
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
      toast.success("تم حفظ ملفّك");
      await queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
    },
    onError: () => toast.error("تعذر حفظ الملف. راجع الحقول وحاول مجدداً."),
  });

  const update = (field: keyof ProfileData, value: string) =>
    setFormData((current) => ({ ...current, [field]: value }));

  const initial = (normalized.businessName || "م").charAt(0);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (isValid) mutation.mutate(normalized);
      }}
      // `mx-auto`: الحاوية الأمّ أوسع بكثير، فبلا توسيط تلتصق الصفحة بحافّة
      // الشاشة ويبقى نصفها فارغاً.
      className="mx-auto w-full max-w-3xl space-y-6 animate-fade-in"
    >
      {/* الترويسة تُري المزوّد ما يراه العميل: الاسم والمدينة كما سيظهران */}
      <Card className="flex-row items-center gap-4 p-5 sm:gap-5 sm:p-6">
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-2xl font-bold text-primary sm:size-20 sm:text-3xl"
        >
          {initial}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
            {normalized.businessName || "نشاطك التجاري"}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {normalized.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 shrink-0" aria-hidden />
                {normalized.city}
              </span>
            )}
            {phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-4 shrink-0" aria-hidden />
                <span dir="ltr" className="font-mono text-xs">
                  {phone}
                </span>
              </span>
            )}
          </p>
        </div>
      </Card>

      <Section
        icon={Store}
        title="نشاطك"
        description="هذه البيانات تظهر للعملاء عند تصفّح خدماتك."
      >
        <Field label="اسم النشاط التجاري" required error={errors.businessName}>
          <Input
            value={formData.businessName}
            onChange={(event) => update("businessName", event.target.value)}
            maxLength={120}
            className="h-11"
          />
        </Field>

        <Field label="اسم المالك المسؤول" required error={errors.ownerName}>
          <Input
            value={formData.ownerName}
            onChange={(event) => update("ownerName", event.target.value)}
            maxLength={120}
            className="h-11"
          />
        </Field>

        <Field
          label="نبذة عن نشاطك"
          full
          hint={`${formData.description.length} / 1000 حرف`}
        >
          <Textarea
            className="resize-none"
            value={formData.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="مثال: ورشة صيانة شاملة مع خدمة إصلاح على الطريق طوال أيام الأسبوع."
            maxLength={1000}
            rows={4}
          />
        </Field>
      </Section>

      <Section icon={MapPin} title="أين يجدك العميل" description="عنوانك ووسيلة التواصل معك.">
        <Field label="المدينة أو المحافظة" required error={errors.city}>
          <Input
            value={formData.city}
            onChange={(event) => update("city", event.target.value)}
            maxLength={100}
            className="h-11"
          />
        </Field>

        <Field label="البريد الإلكتروني" hint="اختياري — للتقارير والإشعارات." error={errors.email}>
          <Input
            type="email"
            dir="ltr"
            autoComplete="email"
            value={formData.email}
            onChange={(event) => update("email", event.target.value)}
            maxLength={160}
            className="h-11"
          />
        </Field>

        <Field label="العنوان التفصيلي" full>
          <Input
            value={formData.address}
            onChange={(event) => update("address", event.target.value)}
            placeholder="مثال: شارع بغداد، مقابل حديقة السبكي"
            maxLength={300}
            className="h-11"
          />
        </Field>
      </Section>

      {/* شريط الحفظ ملتصق بأسفل الشاشة: النموذج أطول من الطية، وزرّ الحفظ
          في نهايته كان يتطلّب تمريراً كاملاً للعودة إليه بعد كل تعديل. */}
      <div className="sticky bottom-4 z-10">
        <Card className="flex-row flex-wrap items-center justify-between gap-4 p-4 shadow-elev-2 sm:p-5">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {isDirty ? (
              <span className="font-semibold text-warning-soft">لديك تعديلات غير محفوظة.</span>
            ) : (
              "كل تعديلاتك محفوظة."
            )}
          </p>
          <Button type="submit" size="lg" disabled={!isDirty || !isValid} loading={mutation.isPending}>
            {!mutation.isPending && <Save aria-hidden />} حفظ التغييرات
          </Button>
        </Card>
      </div>
    </form>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 p-0">
      <div className="border-b border-border/60 p-5 sm:p-6">
        <h2 className="flex items-center gap-2.5 text-lg font-bold text-foreground">
          <Icon className="size-5 text-primary" aria-hidden />
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">{children}</div>
    </Card>
  );
}

function normalize(data: ProfileData) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value.trim()])
  ) as unknown as ProfileData;
}
