"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProviderProfile } from "@/infrastructure/services/profile.service";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "./form-field";
import { toast } from "sonner";
import { Building, User, Mail, MapPin, Loader2, Save, ShieldCheck } from "lucide-react";

interface ProfileFormProps {
  initialData: {
    businessName: string;
    ownerName: string;
    email: string;
    address: string;
    city: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const updateProfileMut = useMutation({
    mutationFn: updateProviderProfile,
    onSuccess: () => {
      toast.success("تم تحديث الملف الشخصي بنجاح");
      queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMut.mutate(formData);
  };

  return (
    <Card className="glass-v2 border border-border/30 rounded-2xl overflow-hidden shadow-xl animate-fade-in-up">
      <CardHeader className="pb-4 border-b border-border/20 bg-secondary/10">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building className="w-3.5 h-3.5 text-primary" />
          </span>
          المعلومات الأساسية لنشاطك التجاري
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground font-medium">
          تظهر هذه البيانات للزبائن عند قبول طلباتهم على التطبيق
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="اسم النشاط التجاري (الورشة/السطحة)" icon={Building}>
              <div className="relative">
                <Building
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
                  size={16}
                  aria-hidden
                />
                <Input
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  placeholder="اسم ورشتك أو مشروعك"
                  className="dark-input pr-10"
                  required
                />
              </div>
            </FormField>

            <FormField label="اسم المالك المسؤول" icon={User}>
              <div className="relative">
                <User
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
                  size={16}
                  aria-hidden
                />
                <Input
                  value={formData.ownerName}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerName: e.target.value })
                  }
                  placeholder="الاسم الكامل لمالك الورشة"
                  className="dark-input pr-10"
                  required
                />
              </div>
            </FormField>

            <FormField label="البريد الإلكتروني" icon={Mail}>
              <div className="relative">
                <Mail
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
                  size={16}
                  aria-hidden
                />
                <Input
                  type="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="example@domain.com"
                  className="dark-input pr-10 text-left"
                />
              </div>
            </FormField>

            <FormField label="المدينة / المحافظة" icon={MapPin}>
              <div className="relative">
                <MapPin
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
                  size={16}
                  aria-hidden
                />
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="دمشق، ريف دمشق، حمص..."
                  className="dark-input pr-10"
                  required
                />
              </div>
            </FormField>

            <FormField label="العنوان التفصيلي ومقر العمل الرئيسي" icon={MapPin} full>
              <div className="relative">
                <MapPin
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none"
                  size={16}
                  aria-hidden
                />
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="اسم الحي، الشارع، علامات مميزة..."
                  className="dark-input pr-10"
                />
              </div>
            </FormField>
          </div>

          {/* Footer actions */}
          <div className="pt-5 border-t border-border/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>تخضع التعديلات لمراجعة الإدارة الأمنية</span>
            </div>
            <Button
              type="submit"
              disabled={updateProfileMut.isPending}
              className="gap-2 px-7 h-11 bg-primary hover:bg-primary/85 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-[1.02] active:scale-100"
            >
              {updateProfileMut.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
