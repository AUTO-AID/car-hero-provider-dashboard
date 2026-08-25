"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// ثابت لا ديناميكي: الأنماط تصل مع حزمة الصفحة، فلا تظهر الخريطة لحظةً
// بلا تنسيق (بلاطات متراكبة وأزرار تكبير عائمة) قبل أن يلحق ملفّها.
import "leaflet/dist/leaflet.css";
import { Crosshair, Expand, LoaderCircle, MapPin, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** دمشق — نقطة البداية حين لا يكون للنشاط موقع محفوظ بعد. */
const FALLBACK: LatLng = { lat: 33.5138, lng: 36.2765 };

export interface LatLng {
  lat: number;
  lng: number;
}

interface ResolvedAddress {
  city?: string;
  address?: string;
}

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (next: LatLng) => void;
  /** يُستدعى بالعنوان المقروء بعد كل تحريك للدبّوس */
  onResolveAddress?: (address: ResolvedAddress) => void;
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
  const [expanded, setExpanded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // النداءات تُقرأ من مراجع لا من الإغلاق: خريطة Leaflet تُبنى مرّة واحدة،
  // ومعالجاتها تعيش خارج دورة تصيير React فتتجمّد على أوّل نسخة من الدالة.
  // والتحديث في تأثير لا أثناء التصيير — التصيير يجب أن يبقى بلا آثار جانبية.
  const onChangeRef = useRef(onChange);
  const onResolveAddressRef = useRef(onResolveAddress);
  useEffect(() => {
    onChangeRef.current = onChange;
    onResolveAddressRef.current = onResolveAddress;
  }, [onChange, onResolveAddress]);

  const commit = useCallback((next: LatLng) => {
    onChangeRef.current(next);
    void reverseGeocode(next.lat, next.lng).then((resolved) => {
      if (resolved) onResolveAddressRef.current?.(resolved);
    });
  }, []);

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
        commit({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setLocating(false);
        setError("تعذّر تحديد موقعك. تأكّد من السماح للمتصفّح باستخدام الموقع.");
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  }, [commit]);

  const currentPositionButton = (
    <Button type="button" variant="outline" onClick={useCurrentPosition} loading={locating}>
      {!locating && <Crosshair aria-hidden />} استخدم موقعي الحالي
    </Button>
  );

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <MapCanvas value={value} onCommit={commit} onError={setError} className="h-72" />

      <div className="flex flex-wrap items-center gap-3">
        {currentPositionButton}

        {/* الخريطة المصغّرة تكفي للمعاينة لا للتصويب: مربّع بارتفاع 288px
            داخل نموذج طويل يصعب فيه تكبير الحيّ والنقر على الزاوية الصحيحة. */}
        <Button type="button" variant="secondary" onClick={() => setExpanded(true)}>
          <Expand aria-hidden /> افتح الخريطة كاملة
        </Button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" aria-hidden />
        أو انقر على الخريطة لتحريك الدبّوس
      </p>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-danger-soft">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {/**
       * حوار بملء الشاشة لا عنصر `fixed`.
       *
       * `.animate-fade-in-up` يُنهي حركته على `transform: translateY(0)` بملء
       * `both`، فيبقى التحويل مطبَّقاً ويصنع **حاوية موضع** — وأيّ `fixed`
       * بداخله يُقاس إليه لا إلى نافذة العرض. الحوار يُصيَّر خارج الشجرة عبر
       * بوّابة، فينجو من ذلك ومن حبس التركيز ومفتاح Escape معاً.
       */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="flex h-[92vh] max-h-[92vh] w-[calc(100%-1.5rem)] max-w-5xl flex-col gap-0 p-0 sm:max-w-5xl">
          {/* `pe-12`: زرّ الإغلاق (X) مثبَّت في الزاوية، وبدون فسحة له يمرّ
              الوصف تحته. */}
          <DialogHeader className="shrink-0 border-b border-border/60 p-4 pe-12">
            <DialogTitle className="text-lg font-bold">حدّد موقع نشاطك</DialogTitle>
            <DialogDescription>
              انقر في أي مكان على الخريطة أو اسحب الدبّوس إلى باب الورشة بالضبط.
            </DialogDescription>
          </DialogHeader>

          {/* `min-h-0`: بدونه يرفض العنصر المرن أن يصغر عن محتواه فتتجاوز
              الخريطة أسفل الحوار ويختفي شريط الأزرار. */}
          <div className="min-h-0 flex-1">
            {expanded && (
              <MapCanvas value={value} onCommit={commit} onError={setError} className="h-full" flush />
            )}
          </div>

          {/* `mx-0 mb-0`: التذييل المشترك يحمل `-mx-4 -mb-4` مصمَّمة لحوارٍ
              حشوُه `p-4`، وهذا الحوار `p-0` — فكان يبرز خارج حدوده. */}
          <DialogFooter className="mx-0 mb-0 shrink-0 sm:justify-between">
            {currentPositionButton}
            <Button type="button" onClick={() => setExpanded(false)}>
              تمّ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MapCanvasProps {
  value: LatLng | null;
  onCommit: (next: LatLng) => void;
  onError: (message: string) => void;
  className?: string;
  /** بلا حافّة ولا زوايا — للاستعمال داخل الحوار */
  flush?: boolean;
}

/**
 * خريطة Leaflet واحدة تُنشأ عند التركيب وتُهدَم عند الفكّ.
 *
 * مفصولة عن `LocationPicker` كي تُستعمل مرّتين — مصغّرة في النموذج وكاملة في
 * الحوار — بحالة واحدة مشتركة بينهما، بدل نقل عقدة DOM حيّة يملكها Leaflet
 * بين موضعين وهو ما لا يحتمله.
 */
function MapCanvas({ value, onCommit, onError, className, flush }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const onCommitRef = useRef(onCommit);
  const onErrorRef = useRef(onError);
  const startRef = useRef(value ?? FALLBACK);
  const hadValueRef = useRef(value !== null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onCommitRef.current = onCommit;
    onErrorRef.current = onError;
  }, [onCommit, onError]);

  useEffect(() => {
    let cancelled = false;

    // استيراد ديناميكي: Leaflet يلمس `window` عند التحميل فلا يعمل في تصيير
    // الخادم، وهو وزن لا يستحقّ أن يُحمَّل مع كل صفحة في اللوحة.
    void (async () => {
      const L = (await import("leaflet")).default;
      const container = containerRef.current;
      if (cancelled || !container || mapRef.current) return;

      const map = L.map(container, {
        center: [startRef.current.lat, startRef.current.lng],
        zoom: hadValueRef.current ? 16 : 12,
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

      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        onCommitRef.current({ lat, lng });
      });

      // النقر على الخريطة ينقل الدبّوس: السحب وحده يفترض أن المستخدم وجد
      // الدبّوس أصلاً، وهو صغير على شاشة لمس.
      map.on("click", (event: import("leaflet").LeafletMouseEvent) => {
        marker.setLatLng(event.latlng);
        onCommitRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
      });

      // الحوار يفتح بحركة تكبير، فتُنشأ الخريطة داخل حاوية لم تبلغ قياسها
      // النهائي بعد فتُحمَّل بلاطات لمساحة خاطئة وتبقى نصف الشاشة رمادية.
      // المراقب يصحّحها عند كل تغيّر قياس — وهو أيضاً ما يعالج طيّ الشريط
      // الجانبي بينما الخريطة معروضة.
      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(container);
      observerRef.current = observer;

      mapRef.current = map;
      markerRef.current = marker;
      setReady(true);
    })().catch(() => onErrorRef.current("تعذّر تحميل الخريطة. تحقّق من اتصالك بالإنترنت."));

    return () => {
      cancelled = true;
      observerRef.current?.disconnect();
      observerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // مزامنة الدبّوس مع قيمة قادمة من الخارج: زرّ «موقعي الحالي»، أو النسخة
  // الأخرى من الخريطة حين تكون الاثنتان مركّبتين معاً.
  useEffect(() => {
    if (!value || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
    mapRef.current.setView([value.lat, value.lng], Math.max(mapRef.current.getZoom(), 16));
  }, [value]);

  return (
    <div className={cn("relative overflow-hidden", !flush && "rounded-xl border border-border", className)}>
      <div
        ref={containerRef}
        className="h-full w-full bg-secondary/40"
        role="application"
        aria-label="خريطة موقع نشاطك — انقر أو اسحب الدبّوس لتحديد الموقع"
      />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-card/70 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" aria-hidden /> جارٍ تحميل الخريطة…
        </div>
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
async function reverseGeocode(lat: number, lng: number): Promise<ResolvedAddress | null> {
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
      [parts.road, parts.neighbourhood || parts.suburb].filter(Boolean).join("، ") || data.display_name;
    return { city, address };
  } catch {
    return null;
  }
}
