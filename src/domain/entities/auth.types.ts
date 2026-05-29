export interface ProviderUser {
  _id?: string;
  id?: string;
  name?: string;
  role?: string;
  fullName: string;
  phoneNumber: string;
  accountType: string;
}

export interface AuthContextType {
  admin: ProviderUser | null;
  provider: ProviderUser | null;
  token: string | null;
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
