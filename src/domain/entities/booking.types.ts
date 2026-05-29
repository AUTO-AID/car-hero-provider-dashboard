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
  status: string;
  payableAmount?: number;
  createdAt: string | number | Date;
  address?: string;
  service?: { name?: string };
  user?: { fullName?: string };
  vehicle?: VehicleInfo;
  location?: GeoLocation;
}
