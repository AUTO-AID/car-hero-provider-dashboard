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

export interface AccountProfile {
  _id?: string;
  id?: string;
  phoneNumber?: string;
  isVerified?: boolean;
  preferences?: {
    language?: string;
    notifications?: {
      push: boolean;
      sms: boolean;
      email: boolean;
    };
  };
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
