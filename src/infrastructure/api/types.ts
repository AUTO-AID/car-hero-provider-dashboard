export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
  path?: string;
}

export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

