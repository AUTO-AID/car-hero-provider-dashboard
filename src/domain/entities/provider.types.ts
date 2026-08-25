export interface DayConfig {
  open: string;
  close: string;
  isClosed: boolean;
}

export type HoursMap = Record<string, DayConfig>;

export interface WorkingHourItem {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface ProviderProfile {
  _id?: string;
  id?: string;
  businessName: string;
  ownerName: string;
  description?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  city: string;
  /** GeoJSON: [longitude, latitude] — يغذّي `/providers/nearby` عبر فهرس 2dsphere */
  location?: { type?: string; coordinates?: [number, number] };

  /**
   * ما ملأه المزوّد في نموذج التسجيل على الموقع التعريفي. كان يُحفظ عند
   * التقديم ثم لا يظهر في اللوحة ولا يستطيع صاحبه تعديله.
   */
  governorate?: string;
  coverageAreas?: string[];
  facilities?: string[];
  /** أسماء ملفّات لا صور: نموذج الموقع يرسل {name,size,type} ولا يرفع الملفّ */
  shopPhotos?: Array<{ name?: string; size?: number; type?: string }>;
  experienceYears?: number;
  techCount?: number;
  isApproved?: boolean;
  isActive?: boolean;
  /** حالة التوفّر التي يراها العملاء — `/providers/nearby` يُرجع `online` فقط */
  status?: "online" | "busy" | "offline";
  registrationStatus: string;
  rejectionReason?: string;
  serviceCategories?: string[];
  services?: string[];
  services_list?: string[];
  requestedServices?: string[];
  servicePrices?: Record<string, number>;
  serviceAvailability?: Record<string, boolean>;
  workingHours?: WorkingHourItem[];
  documents?: string[];
  updatedAt?: string;
}

export interface ServiceCatalogItem {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  basePrice: number;
  discountedPrice: number;
  estimatedDuration: number;
  isEmergency: boolean;
}
