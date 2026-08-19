import {
  Calendar,
  Clock,
  LayoutDashboard,
  Settings,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface AppRoute {
  href: string;
  icon: LucideIcon;
  /** التسمية المختصرة في الشريط الجانبي */
  label: string;
  /** عنوان الصفحة في الهيدر */
  title: string;
  description: string;
}

/**
 * سجلّ المسارات الوحيد.
 *
 * كان لكل مسار تعريفان منفصلان: `navItems` في الشريط الجانبي (أيقونة Lucide +
 * تسمية) و`pageTitles` في الهيدر (إيموجي + عنوان + وصف). فاختلفت التسميات بين
 * الاثنين ("خدماتي وأسعاري" مقابل "خدماتي والأسعار")، وظهرت إيموجي 🏠📋🔧
 * في هيدر لوحة يُفترض أنها احترافية.
 */
export const APP_ROUTES: AppRoute[] = [
  {
    href: "/",
    icon: LayoutDashboard,
    label: "لوحة القيادة",
    title: "لوحة القيادة",
    description: "نظرة عامة على أداء نشاطك",
  },
  {
    href: "/orders",
    icon: Calendar,
    label: "الطلبات والمواعيد",
    title: "الطلبات والمواعيد",
    description: "متابعة طلبات العملاء ومواعيد الخدمة",
  },
  {
    href: "/services",
    icon: Wrench,
    label: "خدماتي وأسعاري",
    title: "خدماتي وأسعاري",
    description: "إدارة الخدمات المعروضة للعملاء وأسعارها",
  },
  {
    href: "/working-hours",
    icon: Clock,
    label: "أوقات الدوام",
    title: "أوقات الدوام",
    description: "تحديد ساعات العمل اليومية",
  },
  {
    href: "/finance",
    icon: Wallet,
    label: "الأرباح والمحفظة",
    title: "الأرباح والمحفظة",
    description: "الرصيد والمعاملات وطلبات السحب",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "إعدادات الحساب",
    title: "إعدادات الحساب",
    description: "الملف التجاري والوثائق وتفضيلات الأمان",
  },
];

/** مجموعات الشريط الجانبي — تشير إلى المسارات بالـ href لا بنسخ منها */
export const NAV_GROUPS: Array<{ group: string; hrefs: string[] }> = [
  { group: "الرئيسية", hrefs: ["/", "/orders"] },
  { group: "الخدمات", hrefs: ["/services", "/working-hours"] },
  { group: "الحساب", hrefs: ["/finance", "/settings"] },
];

const BY_HREF = new Map(APP_ROUTES.map((route) => [route.href, route]));

export function routeByHref(href: string) {
  return BY_HREF.get(href);
}

/** يطابق `/orders/123` مع `/orders`؛ الجذر `/` يطابق تماماً فقط */
export function matchRoute(pathname: string): AppRoute {
  const exact = BY_HREF.get(pathname);
  if (exact) return exact;

  const nested = APP_ROUTES.find(
    (route) => route.href !== "/" && pathname.startsWith(`${route.href}/`)
  );
  return nested ?? APP_ROUTES[0];
}

export function isRouteActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
