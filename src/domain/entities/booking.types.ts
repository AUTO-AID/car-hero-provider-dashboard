export interface VehicleInfo {
  brand?: string;
  model?: string;
  plateNumber?: string;
  color?: string;
  type?: string;
}

export interface GeoLocation {
  type: string;
  coordinates: [number, number];
}

export type DateLike = string | number | Date;

export interface Booking {
  _id: string;
  id?: string;
  orderNumber?: string;
  status: string;
  payableAmount?: number;
  total?: number;
  totalAmount?: number;
  discountAmount?: number;
  createdAt: DateLike;
  scheduledAt?: DateLike;
  isScheduled?: boolean;
  address?: string;
  userNotes?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  service?: { name?: string };
  user?: { fullName?: string; phoneNumber?: string };
  vehicle?: VehicleInfo;
  location?: GeoLocation;

  /**
   * أختام المراحل. الخادم يسجّلها على المستند منذ البداية
   * (`acceptedAt` … `cancelledAt` في `mapToEntity`) ولم تكن اللوحة تقرأ منها
   * شيئاً، فكان «تاريخ الطلب» عندها لحظةً واحدة هي الإنشاء. هي مصدر
   * الخطّ الزمني في نافذة التفاصيل — بلا نداء إضافي للخادم.
   */
  acceptedAt?: DateLike;
  arrivedAt?: DateLike;
  startedAt?: DateLike;
  completedAt?: DateLike;
  cancelledAt?: DateLike;
}

export interface BookingFacets {
  statusCounts: Array<{ _id: string; count: number; revenue: number }>;
  paymentCounts: Array<{ _id: string; count: number }>;
  paymentMethods: Array<{ _id: string; count: number }>;
  services: Array<{ _id: string; count: number }>;
  totals: { revenue: number; avgAmount: number; scheduled: number };
}

export interface BookingPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
