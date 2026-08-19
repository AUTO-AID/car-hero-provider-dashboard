import { isRecord } from "./types";

export function unwrapApiData<T = unknown>(payload: unknown): T {
  let current = payload;

  while (
    isRecord(current) &&
    "data" in current &&
    ("success" in current || "timestamp" in current)
  ) {
    current = current.data;
  }

  return current as T;
}
