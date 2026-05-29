"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProviderProfile,
  updateProviderServices,
} from "@/infrastructure/services/profile.service";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Wrench, Sparkles } from "lucide-react";
import { AddServiceForm } from "./components/add-service-form";
import { ServiceCard } from "./components/service-card";

export default function ProviderServicesPage() {
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: providerQueryKeys.profile,
    queryFn: getProviderProfile,
  });

  const provider = profileData?.data ?? profileData;
  const services: string[] = provider?.services || [];

  const updateServicesMut = useMutation({
    mutationFn: (updatedServices: string[]) =>
      updateProviderServices(
        updatedServices,
        provider?.serviceCategories || []
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
      toast.success("تم تحديث الخدمات بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء التحديث"),
  });

  const handleAddService = (newSvcName: string) => {
    if (services.includes(newSvcName)) {
      toast.warning("الخدمة موجودة مسبقاً");
      return;
    }
    updateServicesMut.mutate([...services, newSvcName]);
  };

  const handleRemoveService = (svc: string) =>
    updateServicesMut.mutate(services.filter((s) => s !== svc));

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse max-w-4xl">
        {/* Page Header Skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card border border-border/20" />
          <div className="space-y-2">
            <div className="h-7 w-32 bg-card rounded-md" />
            <div className="h-4 w-16 bg-card/60 rounded-md" />
          </div>
        </div>

        {/* Main Card Skeleton */}
        <Card className="bg-card/40 border border-border/20 rounded-2xl p-6 space-y-6">
          <div className="flex gap-3">
            <div className="h-12 bg-secondary/30 border border-border/20 rounded-xl flex-1" />
            <div className="h-12 w-28 bg-secondary/80 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-18 bg-secondary/20 border border-border/20 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/40" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-secondary/40 rounded-md" />
                  <div className="h-3 w-36 bg-secondary/20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl">
      {/* ─── Page Header ─── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
          <Wrench className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gradient tracking-tight">
            إدارة خدماتي
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            <span className="text-primary font-bold">{services.length}</span>{" "}
            {services.length === 1 ? "خدمة مضافة" : "خدمات مضافة"}
          </p>
        </div>
      </div>

      {/* ─── Main Card ─── */}
      <Card className="glass-v2 border border-border/30 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/20 bg-secondary/20">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </span>
            الخدمات المقدمة
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Add service input row */}
          <AddServiceForm
            onAdd={handleAddService}
            isPending={updateServicesMut.isPending}
          />

          {/* Services list */}
          <div>
            {services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 rounded-2xl border border-dashed border-border/40 bg-secondary/10">
                <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center">
                  <Wrench className="w-7 h-7 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground/60">
                  لا توجد خدمات مضافة بعد
                </p>
                <p className="text-[11px] text-muted-foreground/40 text-center max-w-[200px]">
                  أضف خدماتك أعلاه حتى يتمكن العملاء من الحجز
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((service, idx) => (
                  <ServiceCard
                    key={idx}
                    service={service}
                    onRemove={() => handleRemoveService(service)}
                    isPending={updateServicesMut.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
