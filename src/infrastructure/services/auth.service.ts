import { api } from "../api/client";

export const providerLogin = (phoneNumber: string, password?: string) =>
  api.post("/auth/login", { phoneNumber, password }).then((res) => res.data);

export const providerLogout = () =>
  api.post("/auth/logout").then((res) => res.data);
