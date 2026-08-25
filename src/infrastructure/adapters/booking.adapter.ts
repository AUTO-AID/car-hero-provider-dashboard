import { Booking } from "@/domain/entities/booking.types";
import { isRecord, UnknownRecord } from "@/infrastructure/api/types";

export type BookingDto = UnknownRecord;

export function normalizeBooking(order: BookingDto): Booking {
  const amount =
    // الترتيب مقصود ومطابق لبقيّة الواجهات: المستحقّ ثم الإجمالي ثم القديم.
    // كان `total` قبل `totalAmount` هنا وحده، فطلبٌ يحمل الحقلين بقيمتين
    // مختلفتين كان يظهر برقم يخالف ما يراه العميل والإدارة.
    getNumber(order.payableAmount) ??
    getNumber(order.totalAmount) ??
    getNumber(order.total) ??
    getNumber(order.servicePrice) ??
    0;

  const service = isRecord(order.service)
    ? order.service
    : { name: getString(order.serviceName) ?? getString(order.serviceId) ?? "خدمة غير معروفة" };

  const user = isRecord(order.user)
    ? order.user
    : { fullName: getString(order.userName) ?? getString(order.userId) ?? "عميل غير معروف" };

  const locationSource = isRecord(order.location) ? order.location : order.userLocation;

  return {
    ...order,
    _id: getString(order._id) ?? getString(order.id) ?? "",
    id: getString(order.id),
    orderNumber: getString(order.orderNumber),
    status: getString(order.status) ?? "pending",
    payableAmount: amount,
    total: amount,
    totalAmount: getNumber(order.totalAmount) ?? amount,
    discountAmount: getNumber(order.discountAmount) ?? 0,
    createdAt: getDateLike(order.createdAt) ?? new Date().toISOString(),
    scheduledAt: getDateLike(order.scheduledAt),
    isScheduled: getBoolean(order.isScheduled),
    address: getString(order.address),
    userNotes: getString(order.userNotes),
    paymentStatus: getString(order.paymentStatus),
    paymentMethod: getString(order.paymentMethod),
    cancellationReason: getString(order.cancellationReason),
    cancelledBy: getString(order.cancelledBy),
    location: isRecord(locationSource) ? (locationSource as unknown as Booking["location"]) : undefined,
    service: { name: getString(service.name) },
    user: {
      fullName: getString(user.fullName),
      phoneNumber: getString(user.phoneNumber),
    },
    vehicle: isRecord(order.vehicle) ? (order.vehicle as Booking["vehicle"]) : undefined,

    // أختام المراحل — تُقرأ صراحةً لا بالانتشار وحده، حتى يراها المُصرِّف
    // ويبقى الخطّ الزمني في نافذة التفاصيل مربوطاً بعقدٍ مكتوب.
    acceptedAt: getDateLike(order.acceptedAt),
    arrivedAt: getDateLike(order.arrivedAt),
    startedAt: getDateLike(order.startedAt),
    completedAt: getDateLike(order.completedAt),
    cancelledAt: getDateLike(order.cancelledAt),
  };
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function getDateLike(value: unknown) {
  return typeof value === "string" || typeof value === "number" || value instanceof Date ? value : undefined;
}
