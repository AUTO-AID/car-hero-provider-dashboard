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

export interface Booking {
  _id: string;
  id?: string;
  orderNumber?: string;
  status: string;
  payableAmount?: number;
  total?: number;
  createdAt: string | number | Date;
  scheduledAt?: string | number | Date;
  isScheduled?: boolean;
  address?: string;
  userNotes?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  cancellationReason?: string;
  service?: { name?: string };
  user?: { fullName?: string; phoneNumber?: string };
  vehicle?: VehicleInfo;
  location?: GeoLocation;
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
