const SCHEME_PREFIX_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//;

export function normalizeHttpUrl(input) {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) return "";
  if (SCHEME_PREFIX_REGEX.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export function isHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
