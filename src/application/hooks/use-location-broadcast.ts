"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { updateBookingLocation } from "@/infrastructure/services/bookings.service";

/**
 * بثّ موقع الفني إلى طلباته النشطة.
 *
 * الخلفية كانت تحفظ موقع المزوّد وتبثّه على غرفة الطلب منذ البداية، وتطبيق
 * العميل يرسم الخريطة — لكن لم يكن في المنظومة كلّها **مُرسِل** واحد. فبقيت
 * المسافة والوقت المتوقّع «غير متاحة» في كل طلب حقيقي. هذا الخطّاف يسدّ تلك
 * الفجوة من المتصفّح مباشرةً.
 *
 * ثلاث قواعد تحكم معدّل الإرسال:
 *  - لا نرسل أسرع من MIN_INTERVAL_MS حتى لو انهال GPS بالقراءات.
 *  - نرسل فوراً إذا تجاوزت الحركة MIN_DISTANCE_M ولو قبل انقضاء المهلة.
 *  - نرسل نبضة كل MAX_SILENCE_MS ولو كان واقفاً، وإلا اعتبر الخادم الإشارة
 *    منقطعة بعد دقيقتين وأطفأ مؤشّر «تتبّع مباشر» عند العميل.
 */

const MIN_INTERVAL_MS = 8000;
const MAX_SILENCE_MS = 45000;
const MIN_DISTANCE_M = 25;

/** قراءة أسوأ من ذلك تضرّ أكثر ممّا تنفع: تقفز السيارة على خريطة العميل. */
const MAX_ACCEPTABLE_ACCURACY_M = 120;

const STORAGE_KEY = "carhero.provider.locationBroadcast";

/**
 * تفضيل المشاركة مخزَّن خارج React.
 *
 * قراءته داخل useEffect ثم استدعاء setState تُنتج تصييراً متتالياً، وقراءته
 * كقيمة ابتدائية أثناء التصيير تُنتج اختلافاً بين الخادم والمتصفّح
 * (hydration mismatch) لأن localStorage غير موجود على الخادم.
 * useSyncExternalStore هي الأداة المصمّمة لهذه الحالة بالضبط: لقطة للخادم
 * ولقطة للمتصفّح، واشتراك يُعلم كل النسخ عند التغيير.
 */
const preferenceListeners = new Set<() => void>();
let cachedPreference: boolean | null = null;

function readPreference(): boolean {
  if (cachedPreference !== null) return cachedPreference;
  try {
    cachedPreference = window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    cachedPreference = false;
  }
  return cachedPreference;
}

function subscribePreference(onChange: () => void): () => void {
  preferenceListeners.add(onChange);
  return () => {
    preferenceListeners.delete(onChange);
  };
}

function writePreference(value: boolean): void {
  cachedPreference = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // التخزين المحجوب لا يمنع البثّ في هذه الجلسة
  }
  preferenceListeners.forEach((listener) => listener());
}

export type BroadcastState = {
  supported: boolean;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  error: string;
  lastSentAt: number | null;
  accuracyM: number | null;
  sentCount: number;
  skippedCount: number;
};

function metersBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function messageForPositionError(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return "رُفض إذن الموقع. فعّله من إعدادات الموقع في المتصفّح ثم أعد المحاولة.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "تعذّر تحديد موقعك. تأكّد من تفعيل خدمة الموقع في الجهاز.";
  }
  return "انتهت مهلة تحديد الموقع. سنعيد المحاولة تلقائياً.";
}

export function useLocationBroadcast(orderIds: string[]): BroadcastState {
  const enabled = useSyncExternalStore(subscribePreference, readPreference, () => false);

  const [error, setError] = useState("");
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  // المعرّفات تتغيّر مع كل إعادة جلب للقائمة؛ قراءتها من مرجع تمنع إعادة
  // تشغيل المراقبة (وإعادة طلب الإذن) عند كل تحديث لا يغيّر شيئاً فعلياً.
  const orderIdsRef = useRef<string[]>(orderIds);
  useEffect(() => {
    orderIdsRef.current = orderIds;
  }, [orderIds]);

  const lastFixRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSendRef = useRef(0);
  const inFlightRef = useRef(false);

  const setEnabled = useCallback((value: boolean) => {
    writePreference(value);
    setError("");
  }, []);

  useEffect(() => {
    if (!enabled || !supported) return undefined;

    const send = async (position: GeolocationPosition) => {
      const ids = orderIdsRef.current;
      if (!ids.length || inFlightRef.current) return;

      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      setAccuracyM(Number.isFinite(accuracy) ? Math.round(accuracy) : null);

      // قراءة رديئة الدقّة تُظهر الفني في شارع آخر؛ تجاهلها أصدق من بثّها.
      if (Number.isFinite(accuracy) && accuracy > MAX_ACCEPTABLE_ACCURACY_M) {
        setSkippedCount((n) => n + 1);
        return;
      }

      const now = Date.now();
      const fix = { lat: latitude, lng: longitude };
      const movedM = lastFixRef.current ? metersBetween(lastFixRef.current, fix) : Infinity;
      const sinceLast = now - lastSendRef.current;

      const shouldSend =
        lastSendRef.current === 0 ||
        sinceLast >= MAX_SILENCE_MS ||
        (sinceLast >= MIN_INTERVAL_MS && movedM >= MIN_DISTANCE_M);
      if (!shouldSend) return;

      inFlightRef.current = true;
      lastSendRef.current = now;
      try {
        await Promise.all(
          ids.map((id) =>
            updateBookingLocation(id, {
              coordinates: [longitude, latitude],
              // الحقول الاختيارية تُحذف إن كانت null: الخادم يرفض null صراحةً
              // بينما يقبل غيابها، وإرسالها كان سيُفشل كل نبضة على سطح المكتب
              // حيث لا يوفّر المتصفّح heading ولا speed.
              accuracy: Number.isFinite(accuracy) ? Math.max(0, accuracy) : undefined,
              heading:
                heading != null && Number.isFinite(heading)
                  ? Math.min(360, Math.max(0, heading))
                  : undefined,
              speed: speed != null && Number.isFinite(speed) ? Math.max(0, speed) : undefined,
            }),
          ),
        );
        lastFixRef.current = fix;
        setLastSentAt(now);
        setSentCount((n) => n + 1);
        setError("");
      } catch (sendError) {
        const message =
          sendError instanceof Error ? sendError.message : "تعذّر إرسال الموقع";
        setError(`تعذّر إرسال الموقع: ${message}`);
      } finally {
        inFlightRef.current = false;
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        void send(position);
      },
      (positionError) => setError(messageForPositionError(positionError)),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      lastSendRef.current = 0;
      lastFixRef.current = null;
    };
  }, [enabled, supported]);

  return { supported, enabled, setEnabled, error, lastSentAt, accuracyM, sentCount, skippedCount };
}
