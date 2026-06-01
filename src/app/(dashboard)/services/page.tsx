"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, RefreshCw, Search, Wrench } from "lucide-react";
import { toast } from "sonner";
import { providerQueryKeys } from "@/application/services/prefetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProviderProfile, getServiceCatalog, ServiceCatalogItem, updateProviderServices } from "@/infrastructure/services/profile.service";
import { ServiceCard } from "./components/service-card";

type Filter = "all" | "mine" | "enabled" | "disabled";
const categoryLabels: Record<string, string> = {
  all: "كل الفئات", roadside_assistance: "مساعدة طريق", towing: "السحب", battery: "البطارية",
  tire: "الإطارات", fuel: "الوقود", lockout: "الأقفال", maintenance: "الصيانة", car_wash: "الغسيل", other: "أخرى",
};

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

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-4"><span className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"><Wrench className="w-5 h-5 text-primary" /></span><div><h1 className="text-2xl font-black tracking-tight">خدماتي والأسعار</h1><p className="text-sm text-muted-foreground mt-0.5">إدارة الخدمات التي تظهر للعملاء وأسعارها الخاصة بنشاطك</p></div></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="خدماتي" value={services.length} />
        <Metric label="متاحة للحجز" value={activeCount} />
        <Metric label="متوقفة مؤقتاً" value={services.length - activeCount} />
        <Metric label="كتالوج المنصة" value={dedupeCatalog(catalog, selected).length} />
      </div>
      <Card className="glass-v2 border-border/30 rounded-lg overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
            <label className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم الخدمة..." className="pr-9" /></label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 rounded-lg border border-border/40 bg-background px-3 text-xs outline-none">
              {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {([["all", "كل الكتالوج"], ["mine", "خدماتي"], ["enabled", "المتاحة"], ["disabled", "المتوقفة"]] as Array<[Filter, string]>).map(([value, label]) => <button type="button" key={value} onClick={() => setFilter(value)} className={`h-8 px-3 rounded-md text-xs font-bold border transition-colors ${filter === value ? "bg-primary text-primary-foreground border-primary" : "border-border/30 text-muted-foreground hover:text-foreground"}`}>{label}</button>)}
          </div>
          {visibleCatalog.length ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{visibleCatalog.map((service) => <ServiceCard key={service.id} service={service} selected={selected.has(service.id)} enabled={availability[service.id] !== false} price={prices[service.id] ?? (service.discountedPrice || service.basePrice)} pending={mutation.isPending} onAdd={() => save([...services, service.id], { ...prices, [service.id]: service.discountedPrice || service.basePrice }, { ...availability, [service.id]: true })} onDelete={() => save(services.filter((id) => id !== service.id))} onToggle={(enabled) => save(services, prices, { ...availability, [service.id]: enabled })} onPrice={(price) => save(services, { ...prices, [service.id]: price })} />)}</div> : <Empty /> }
        </CardContent>
      </Card>
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
function Metric({ label, value }: { label: string; value: number }) { return <div className="p-3 rounded-lg border border-border/25 bg-secondary/10"><p className="text-[11px] text-muted-foreground">{label}</p><p className="text-xl font-black mt-1">{value}</p></div>; }
function Empty() { return <div className="py-12 text-center text-xs text-muted-foreground"><Wrench className="w-7 h-7 mx-auto mb-2 opacity-40" />لا توجد خدمات تطابق البحث أو الفلاتر.</div>; }
function Loading() { return <div className="min-h-[55vh] flex items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin text-primary" /> جاري تحميل الخدمات...</div>; }
function LoadError({ retry }: { retry: () => void }) { return <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3 text-center"><AlertCircle className="w-7 h-7 text-rose-400" /><p className="text-sm font-bold">تعذر تحميل الخدمات</p><Button onClick={retry} className="gap-2"><RefreshCw className="w-4 h-4" /> إعادة المحاولة</Button></div>; }
