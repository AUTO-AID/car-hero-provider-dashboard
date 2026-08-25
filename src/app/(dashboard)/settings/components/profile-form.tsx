"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Phone, Save, Store, Users, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { updateProviderLocation, updateProviderProfile } from "@/infrastructure/services/profile.service";
import { LocationPicker, type LatLng } from "./location-picker";

interface ProfileData {
  businessName: string;
  ownerName: string;
  /** من نموذج التسجيل على الموقع — كانت تُحفظ ولا تظهر ولا تُعدَّل */
  governorate: string;
  coverageAreas: string[];
  experienceYears: number;
  techCount: number;
  /**
   * لا يُعرض ولا يُحرَّر — حقل البريد حُذف من الواجهة. تُعاد القيمة المحفوظة
   * كما هي في كل حفظ حتى لا يمحوها التحديث، ولا تُتحقَّق منها: بريدٌ قديم
   * غير صالح كان سيُقفل زرّ الحفظ إلى الأبد بلا حقل يصحّحه.
   */
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
export function ProfileForm({
  initialData,
  phone,
  initialCoords,
}: {
  initialData: ProfileData;
  phone?: string;
  initialCoords: LatLng | null;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(initialData);
  const [coords, setCoords] = useState<LatLng | null>(initialCoords);
  const [manualAddress, setManualAddress] = useState(false);
  const normalized = useMemo(() => normalize(formData), [formData]);
  const coordsMoved =
    coords !== null &&
    (initialCoords === null ||
      Math.abs(coords.lat - initialCoords.lat) > 1e-7 ||
      Math.abs(coords.lng - initialCoords.lng) > 1e-7);
  const isDirty =
    JSON.stringify(normalized) !== JSON.stringify(normalize(initialData)) || coordsMoved;

  // الأخطاء تظهر تحت الحقل نفسه بدل toast يختفي قبل أن يعرف المستخدم أيّ حقل يقصد
  const errors = {
    businessName: normalized.businessName.length > 0 && normalized.businessName.length < 2 ? "حرفان على الأقل." : undefined,
    ownerName: normalized.ownerName.length > 0 && normalized.ownerName.length < 2 ? "حرفان على الأقل." : undefined,
    city: normalized.city.length > 0 && normalized.city.length < 2 ? "حرفان على الأقل." : undefined,
  };
  const isValid =
    normalized.businessName.length >= 2 &&
    normalized.ownerName.length >= 2 &&
    normalized.city.length >= 2;

  const mutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      const { email, ...payload } = data;
      await updateProviderProfile(email ? { ...payload, email } : payload);
      // الموقع نقطة نهاية منفصلة في الخادم (`PUT /providers/me/location`)،
      // ولا يُرسل إلا حين تحرّك الدبّوس فعلاً.
      if (coords && coordsMoved) {
        await updateProviderLocation({ latitude: coords.lat, longitude: coords.lng });
      }
    },
    onSuccess: async () => {
      toast.success("تم حفظ ملفّك");
      await queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
    },
    onError: () => toast.error("تعذر حفظ الملف. راجع الحقول وحاول مجدداً."),
  });

  const update = (field: keyof ProfileData, value: string) =>
    setFormData((current) => ({ ...current, [field]: value }));

  // حقل رقمي فارغ يعطي NaN، وإرساله يُسقط التحقّق في الخادم برسالة غامضة.
  const updateNumber = (field: "experienceYears" | "techCount", value: string) =>
    setFormData((current) => ({ ...current, [field]: Number(value) || 0 }));

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

      <Section
        icon={MapPin}
        title="أين يجدك العميل"
        description="حدّد موقع ورشتك على الخريطة — منه يجدك العملاء القريبون."
      >
        <div className="col-span-full">
          <LocationPicker
            value={coords}
            onChange={setCoords}
            // العنوان يُملأ تلقائياً من الخريطة، ويبقى قابلاً للتصحيح يدوياً
            onResolveAddress={(resolved) =>
              setFormData((current) => ({
                ...current,
                city: resolved.city || current.city,
                address: resolved.address || current.address,
              }))
            }
          />
        </div>

        {/* العنوان النصّي نتيجةٌ لا مُدخَل: يُقرأ من الخريطة ويُعرض للتأكيد.
            الحقلان يبقيان خلف زرّ لأن الترجمة العكسية قد تُخطئ اسم الحيّ في
            المدن السورية، ولأن `city` مفهرسة في الخادم ويُبحث بها. */}
        <div className="col-span-full rounded-xl border border-border/60 bg-secondary/25 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted-foreground">العنوان المقروء من الخريطة</p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {[normalized.city, normalized.address].filter(Boolean).join(" — ") || "لم يُحدَّد بعد"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setManualAddress((current) => !current)}
              aria-expanded={manualAddress}
            >
              <Pencil aria-hidden /> {manualAddress ? "إخفاء التعديل اليدوي" : "تعديل يدوي"}
            </Button>
          </div>

          {manualAddress && (
            <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field label="المدينة أو المحافظة" required error={errors.city}>
                <Input
                  value={formData.city}
                  onChange={(event) => update("city", event.target.value)}
                  maxLength={100}
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
            </div>
          )}
        </div>
      </Section>

      <Section
        icon={Users}
        title="نطاق عملك"
        description="ما سجّلته عند التقديم على الموقع — عدّله متى تغيّر."
      >
        <div className="col-span-full">
          <Field label="المناطق التي تخدمها" full>
            <TagInput
              value={formData.coverageAreas}
              onChange={(next) => setFormData((current) => ({ ...current, coverageAreas: next }))}
              placeholder="اكتب اسم المنطقة ثم اضغط Enter — مثال: المزة"
              aria-label="المناطق التي تخدمها"
            />
          </Field>
        </div>

        <Field label="المحافظة">
          <Input
            value={formData.governorate}
            onChange={(event) => update("governorate", event.target.value)}
            maxLength={100}
            className="h-11"
          />
        </Field>

        <Field label="عدد الفنّيين لديك">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={500}
            value={formData.techCount}
            onChange={(event) => updateNumber("techCount", event.target.value)}
            className="h-11"
          />
        </Field>

        <Field label="سنوات الخبرة" full>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={80}
            value={formData.experienceYears}
            onChange={(event) => updateNumber("experienceYears", event.target.value)}
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

/** التشذيب للنصوص وحدها: `Object.entries` يمرّ على المصفوفة والأرقام أيضاً. */
function normalize(data: ProfileData): ProfileData {
  return {
    ...data,
    businessName: data.businessName.trim(),
    ownerName: data.ownerName.trim(),
    email: data.email.trim(),
    address: data.address.trim(),
    city: data.city.trim(),
    description: data.description.trim(),
    governorate: data.governorate.trim(),
    coverageAreas: data.coverageAreas.map((area) => area.trim()).filter(Boolean),
  };
}
