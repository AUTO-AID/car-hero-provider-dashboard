"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// ثابت لا ديناميكي: الأنماط تصل مع حزمة الصفحة، فلا تظهر الخريطة لحظةً
// بلا تنسيق (بلاطات متراكبة وأزرار تكبير عائمة) قبل أن يلحق ملفّها.
import "leaflet/dist/leaflet.css";
import { Crosshair, LoaderCircle, MapPin, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** دمشق — نقطة البداية حين لا يكون للنشاط موقع محفوظ بعد. */
const FALLBACK: LatLng = { lat: 33.5138, lng: 36.2765 };

export interface LatLng {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (next: LatLng) => void;
  /** يُستدعى بالعنوان المقروء بعد كل تحريك للدبّوس */
  onResolveAddress?: (address: { city?: string; address?: string }) => void;
  className?: string;
}

/**
 * منتقي موقع النشاط على خريطة.
 *
 * كان الموقع حقلَي نصّ («المدينة» و«العنوان التفصيلي») لا صلة لهما بالإحداثيات
 * التي يبحث بها العملاء: `/providers/nearby` يستعلم عن `location` بفهرس
 * 2dsphere، فكان بإمكان المزوّد أن يكتب مدينته صحيحةً ويبقى دبّوسه حيث سُجّل
 * لحظة إنشاء الحساب — أو عند (0,0) — فلا يظهر لأحد.
 *
 * Leaflet مع بلاطات OpenStreetMap: بلا مفتاح API وبلا حساب، ويُحمَّل عند فتح
 * الصفحة وحدها لا مع حزمة اللوحة كلّها.
 */
export function LocationPicker({ value, onChange, onResolveAddress, className }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  // النداءات تُقرأ من مراجع لا من الإغلاق: خريطة Leaflet تُبنى مرّة واحدة،
  // ومعالجاتها تعيش خارج دورة تصيير React فتتجمّد على أوّل نسخة من الدالة.
  // والتحديث في تأثير لا أثناء التصيير — التصيير يجب أن يبقى بلا آثار جانبية.
  const onChangeRef = useRef(onChange);
  const onResolveAddressRef = useRef(onResolveAddress);
  useEffect(() => {
    onChangeRef.current = onChange;
    onResolveAddressRef.current = onResolveAddress;
  }, [onChange, onResolveAddress]);

  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = value ?? FALLBACK;
  const startRef = useRef(start);

  useEffect(() => {
    let cancelled = false;

    // استيراد ديناميكي: Leaflet يلمس `window` عند التحميل، ولا يعمل في تصيير
    // الخادم. وهو أيضاً وزن لا يستحقّ أن يُحمَّل مع كل صفحة في اللوحة.
    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [startRef.current.lat, startRef.current.lng],
        zoom: value ? 16 : 12,
        attributionControl: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      // أيقونة مرسومة هنا لا من ملفّات Leaflet الافتراضية: مساراتها النسبية
      // تنكسر تحت تجزئة الأصول في Next، فيظهر الدبّوس صورةً مكسورة.
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:block;width:28px;height:28px;border-radius:999px 999px 999px 2px;transform:rotate(-45deg);background:hsl(var(--primary));border:3px solid hsl(var(--background));box-shadow:0 4px 12px rgba(0,0,0,.45)"></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const marker = L.marker([startRef.current.lat, startRef.current.lng], {
        draggable: true,
        icon,
        keyboard: true,
        title: "موقع نشاطك — اسحبه لتعديله",
      }).addTo(map);

      const commit = (lat: number, lng: number) => {
        onChangeRef.current({ lat, lng });
        void reverseGeocode(lat, lng).then((resolved) => {
          if (resolved) onResolveAddressRef.current?.(resolved);
        });
      };

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        commit(lat, lng);
      });

      // النقر على الخريطة ينقل الدبّوس: السحب وحده يفترض أن المستخدم وجد
      // الدبّوس أصلاً، وهو صغير على شاشة لمس.
      map.on("click", (event: import("leaflet").LeafletMouseEvent) => {
        marker.setLatLng(event.latlng);
        commit(event.latlng.lat, event.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setReady(true);
    })().catch(() => setError("تعذّر تحميل الخريطة. تحقّق من اتصالك بالإنترنت."));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // مرّة واحدة: الخريطة تُنشأ ثم تُحدَّث بالأمر لا بإعادة البناء
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // مزامنة الدبّوس مع قيمة قادمة من الخارج (زرّ «موقعي الحالي»)
  useEffect(() => {
    if (!value || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
    mapRef.current.setView([value.lat, value.lng], Math.max(mapRef.current.getZoom(), 16));
  }, [value]);

  const useCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("متصفّحك لا يدعم تحديد الموقع.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        onChangeRef.current({ lat: latitude, lng: longitude });
        void reverseGeocode(latitude, longitude).then((resolved) => {
          if (resolved) onResolveAddressRef.current?.(resolved);
        });
      },
      () => {
        setLocating(false);
        setError("تعذّر تحديد موقعك. تأكّد من السماح للمتصفّح باستخدام الموقع.");
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  }, []);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative overflow-hidden rounded-xl border border-border">
        <div
          ref={containerRef}
          className="h-72 w-full bg-secondary/40"
          role="application"
          aria-label="خريطة موقع نشاطك — انقر أو اسحب الدبّوس لتحديد الموقع"
        />

        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-card/70 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" aria-hidden /> جارٍ تحميل الخريطة…
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={useCurrentPosition} loading={locating}>
          {!locating && <Crosshair aria-hidden />} استخدم موقعي الحالي
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          أو انقر على الخريطة لتحريك الدبّوس
        </p>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-danger-soft">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * تحويل الإحداثيات إلى عنوان مقروء عبر Nominatim (خدمة OSM المجانية).
 *
 * الفشل هنا **غير قاتل**: الإحداثيات هي ما يعتمد عليه البحث عن المزوّدين،
 * والعنوان النصّي راحةٌ للقراءة. لذلك يُبتلع الخطأ ويبقى ما كتبه المزوّد.
 */
async function reverseGeocode(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ar`,
      { headers: { Accept: "application/json" } }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      address?: Record<string, string>;
      display_name?: string;
    };
    const parts = data.address ?? {};
    const city = parts.city || parts.town || parts.village || parts.state || parts.county;
    const address =
      [parts.road, parts.neighbourhood || parts.suburb].filter(Boolean).join("، ") ||
      data.display_name;
    return { city, address };
  } catch {
    return null;
  }
}
