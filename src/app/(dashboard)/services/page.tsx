"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Package, Wrench } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar, type ActiveFilterChip } from "@/components/ui/data-toolbar";
import { Select, optionsFromMap } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { getProviderProfile, getServiceCatalog, updateProviderServices } from "@/infrastructure/services/profile.service";
import { ServiceCatalogItem } from "@/domain/entities/provider.types";
import { ServiceCard } from "./components/service-card";
import { StatCard } from "@/components/ui/stat-card";

type Filter = "all" | "mine" | "enabled" | "disabled";
const categoryLabels: Record<string, string> = {
  all: "كل الفئات", roadside_assistance: "مساعدة طريق", towing: "السحب", battery: "البطارية",
  tire: "الإطارات", fuel: "الوقود", lockout: "الأقفال", maintenance: "الصيانة", car_wash: "الغسيل", other: "أخرى",
};
const FILTER_LABELS: Record<Filter, string> = {
  all: "كل الكتالوج",
  mine: "خدماتي فقط",
  enabled: "المتاحة للحجز",
  disabled: "المتوقّفة",
};
const CATEGORY_OPTIONS = optionsFromMap(categoryLabels);
const FILTER_OPTIONS = optionsFromMap(FILTER_LABELS);

export default function ProviderServicesPage() {
  const profileQuery = useQuery({ queryKey: providerQueryKeys.profile, queryFn: getProviderProfile });
  const catalogQuery = useQuery({ queryKey: ["service-catalog"], queryFn: getServiceCatalog });
  if (profileQuery.isLoading || catalogQuery.isLoading) return <Loading />;
  if (profileQuery.isError || catalogQuery.isError) return <LoadError retry={() => { void profileQuery.refetch(); void catalogQuery.refetch(); }} />;
  return <ServicesManager profile={profileQuery.data ?? {}} catalog={catalogQuery.data ?? []} />;
}

function ServicesManager({ profile, catalog }: { profile: { services?: string[]; servicePrices?: Record<string, number>; serviceAvailability?: Record<string, boolean> }; catalog: ServiceCatalogItem[] }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [services, setServices] = useState(profile.services ?? []);
  const [prices, setPrices] = useState(profile.servicePrices ?? {});
  const [availability, setAvailability] = useState(profile.serviceAvailability ?? {});
  const selected = useMemo(() => new Set(services), [services]);
  const visibleCatalog = useMemo(() => dedupeCatalog(catalog, selected).filter((service) => {
    const matchesSearch = `${service.name} ${service.nameAr}`.toLowerCase().includes(search.trim().toLowerCase());
    const matchesCategory = category === "all" || service.category === category;
    const isSelected = selected.has(service.id);
    const isEnabled = availability[service.id] !== false;
    const matchesFilter = filter === "all" || (filter === "mine" && isSelected) || (filter === "enabled" && isSelected && isEnabled) || (filter === "disabled" && isSelected && !isEnabled);
    return matchesSearch && matchesCategory && matchesFilter;
  }), [availability, catalog, category, filter, search, selected]);
  const mutation = useMutation({
    mutationFn: updateProviderServices,
    onSuccess: async (updated) => {
      setServices(updated.services ?? []);
      setPrices(updated.servicePrices ?? {});
      setAvailability(updated.serviceAvailability ?? {});
      toast.success("تم تحديث خدماتك.");
      await queryClient.invalidateQueries({ queryKey: providerQueryKeys.profile });
    },
    onError: () => toast.error("تعذر تحديث الخدمات. راجع البيانات وحاول مجدداً."),
  });
  const save = (nextServices: string[], nextPrices = prices, nextAvailability = availability) => mutation.mutate({ services: nextServices, servicePrices: pick(nextPrices, nextServices), serviceAvailability: pickAvailability(nextAvailability, nextServices) });
  const activeCount = services.filter((id) => availability[id] !== false).length;

  const catalogSize = dedupeCatalog(catalog, selected).length;
  const chips: ActiveFilterChip[] = [
    search && { key: "search", label: `بحث: ${search}`, onRemove: () => setSearch("") },
    category !== "all" && { key: "category", label: `الفئة: ${categoryLabels[category]}`, onRemove: () => setCategory("all") },
    filter !== "all" && { key: "filter", label: FILTER_LABELS[filter], onRemove: () => setFilter("all") },
  ].filter(Boolean) as ActiveFilterChip[];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="خدماتي" value={services.length} icon={Wrench} tone="info" />
        <StatCard title="متاحة للحجز" value={activeCount} icon={CheckCircle2} tone="success" />
        <StatCard title="متوقّفة مؤقتاً" value={services.length - activeCount} icon={AlertCircle} tone="danger" />
        <StatCard title="كتالوج المنصّة" value={catalogSize} icon={Package} />
      </div>

      <DataToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="ابحث باسم الخدمة…"
        searchLabel="بحث في الخدمات"
        chips={chips}
        onReset={() => { setSearch(""); setCategory("all"); setFilter("all"); }}
        resultCount={visibleCatalog.length}
      >
        <Select aria-label="فئة الخدمة" value={category} onValueChange={setCategory} options={CATEGORY_OPTIONS} />
        <Select aria-label="تصفية حسب الحالة" value={filter} onValueChange={(value) => setFilter(value as Filter)} options={FILTER_OPTIONS} />
      </DataToolbar>

      {visibleCatalog.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visibleCatalog.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={selected.has(service.id)}
              enabled={availability[service.id] !== false}
              price={prices[service.id] ?? (service.discountedPrice || service.basePrice)}
              pending={mutation.isPending}
              onAdd={() => save([...services, service.id], { ...prices, [service.id]: service.discountedPrice || service.basePrice }, { ...availability, [service.id]: true })}
              onDelete={() => save(services.filter((id) => id !== service.id))}
              onToggle={(enabled) => save(services, prices, { ...availability, [service.id]: enabled })}
              onPrice={(price) => save(services, { ...prices, [service.id]: price })}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <EmptyState
            icon={Wrench}
            title="لا توجد خدمات مطابقة"
            description="جرّب تغيير الفئة أو مسح البحث لعرض كتالوج المنصّة كاملاً."
            action={chips.length ? <Button type="button" variant="outline" size="sm" onClick={() => { setSearch(""); setCategory("all"); setFilter("all"); }}>مسح الفلاتر</Button> : undefined}
          />
        </Card>
      )}
    </div>
  );
}

function dedupeCatalog(catalog: ServiceCatalogItem[], selected: Set<string>) {
  const result = new Map<string, ServiceCatalogItem>();
  catalog.forEach((service) => { const key = `${service.category}:${service.nameAr || service.name}`; const current = result.get(key); if (!current || selected.has(service.id)) result.set(key, service); });
  return Array.from(result.values());
}
function pick(prices: Record<string, number>, ids: string[]) { return Object.fromEntries(ids.filter((id) => prices[id] !== undefined).map((id) => [id, prices[id]])); }
function pickAvailability(values: Record<string, boolean>, ids: string[]) { return Object.fromEntries(ids.map((id) => [id, values[id] ?? true])); }

function Loading() { return <LoadingState label="جارٍ تحميل الخدمات…" />; }
function LoadError({ retry }: { retry: () => void }) { return <ErrorState title="تعذّر تحميل الخدمات" description="لم يستجب الخادم لطلب كتالوج الخدمات أو ملفّك." onRetry={retry} />; }
