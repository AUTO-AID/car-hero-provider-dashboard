export interface ProviderUser {
  _id?: string;
  id?: string;
  name?: string;
  businessName?: string;
  role?: string;
  fullName: string;
  phoneNumber: string;
  accountType: string;
}

export interface ProviderAuthResponse {
  user: Partial<ProviderUser>;
  accessToken: string;
  refreshToken: string;
}

export interface AuthContextType {
  provider: ProviderUser | null;
  token: string | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
