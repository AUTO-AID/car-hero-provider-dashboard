export function unwrapApiData<T = any>(payload: any): T {
  let current = payload;

  while (
    current &&
    typeof current === "object" &&
    "data" in current &&
    ("success" in current || "timestamp" in current)
  ) {
    current = current.data;
  }

  return current as T;
}
