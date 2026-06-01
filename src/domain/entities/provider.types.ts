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
  email?: string;
  phone?: string;
  address?: string;
  city: string;
  isApproved?: boolean;
  isActive?: boolean;
  registrationStatus: string;
  rejectionReason?: string;
  serviceCategories?: string[];
  services?: string[];
  servicePrices?: Record<string, number>;
  serviceAvailability?: Record<string, boolean>;
  workingHours?: WorkingHourItem[];
  documents?: string[];
}
