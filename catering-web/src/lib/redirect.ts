// Validates a `redirect` query/form value as a same-origin path, to prevent
// open redirects (e.g. `?redirect=https://evil.example.com`).
export function safeRedirectTarget(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
