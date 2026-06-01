"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building, Loader2, Mail, MapPin, Save, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProviderProfile } from "@/infrastructure/services/profile.service";
import { FormField } from "./form-field";

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
  const isValid = normalized.businessName.length >= 2 && normalized.ownerName.length >= 2 && normalized.city.length >= 2;
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
    <Card className="glass-v2 border-border/30 rounded-lg overflow-hidden">
      <CardHeader className="border-b border-border/20 bg-secondary/10">
        <CardTitle className="text-base flex items-center gap-2"><Building className="w-4 h-4 text-primary" /> المعلومات الأساسية</CardTitle>
        <CardDescription className="text-xs">تظهر هذه البيانات للعملاء عند عرض نشاطك وخدماتك.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={(event) => { event.preventDefault(); if (isValid) mutation.mutate(normalized); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="اسم النشاط التجاري" icon={Building}><Input value={formData.businessName} onChange={(event) => update("businessName", event.target.value)} required minLength={2} maxLength={120} /></FormField>
            <FormField label="اسم المالك المسؤول" icon={User}><Input value={formData.ownerName} onChange={(event) => update("ownerName", event.target.value)} required minLength={2} maxLength={120} /></FormField>
            <FormField label="البريد الإلكتروني" icon={Mail}><Input type="email" dir="ltr" value={formData.email} onChange={(event) => update("email", event.target.value)} maxLength={160} /></FormField>
            <FormField label="المدينة أو المحافظة" icon={MapPin}><Input value={formData.city} onChange={(event) => update("city", event.target.value)} required minLength={2} maxLength={100} /></FormField>
            <FormField label="العنوان التفصيلي" icon={MapPin} full><Input value={formData.address} onChange={(event) => update("address", event.target.value)} maxLength={300} /></FormField>
            <FormField label="وصف النشاط" icon={Building} full><Textarea value={formData.description} onChange={(event) => update("description", event.target.value)} maxLength={1000} rows={4} /></FormField>
          </div>
          <div className="pt-4 border-t border-border/20 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="w-4 h-4 text-emerald-400" /> تحفظ التعديلات مباشرة في ملف نشاطك.</span>
            <Button type="submit" disabled={!isDirty || !isValid || mutation.isPending} className="gap-2">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ التغييرات
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
