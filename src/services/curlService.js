import { normalizeHttpUrl } from "@/lib/url";

function shellQuote(value) {
  return `'${String(value ?? "").replace(/'/g, "'\\''")}'`;
}

function pairsToObject(pairs = []) {
  return pairs.reduce((acc, item) => {
    if (!item?.key) return acc;
    acc[item.key] = item.value ?? "";
    return acc;
  }, {});
}

function applyAuthHeader(headers, auth = {}) {
  if (auth.type === "bearer" && auth.bearerToken) {
    headers.Authorization = `Bearer ${auth.bearerToken}`;
  }

  if (auth.type === "basic") {
    const credentials = `${auth.username || ""}:${auth.password || ""}`;
    headers.Authorization = `Basic ${btoa(credentials)}`;
  }
}

function buildUrlWithParams(url, params = []) {
  const filteredParams = params.filter((item) => item?.key);
  if (!filteredParams.length) return url;

  const searchParams = new URLSearchParams();
  filteredParams.forEach((item) => {
    searchParams.append(item.key, item.value ?? "");
  });

  try {
    const parsed = new URL(url);
    filteredParams.forEach((item) => {
      parsed.searchParams.append(item.key, item.value ?? "");
    });
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${searchParams.toString()}`;
  }
}

export function generateCurlCommand(payload) {
  const urlWithParams = buildUrlWithParams(
    normalizeHttpUrl(payload.url),
    payload.params,
  );
  const headers = pairsToObject(payload.headers);
  applyAuthHeader(headers, payload.auth);

  if (payload.method !== "GET" && payload.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const lines = [`curl -X ${payload.method} ${shellQuote(urlWithParams)}`];

  Object.entries(headers).forEach(([key, value]) => {
    lines.push(`  -H ${shellQuote(`${key}: ${value ?? ""}`)}`);
  });

  if (payload.auth?.type === "cookie" && payload.auth.cookie) {
    lines.push(`  --cookie ${shellQuote(payload.auth.cookie)}`);
  }

  if (payload.method !== "GET" && payload.body !== undefined) {
    lines.push(`  --data-raw ${shellQuote(JSON.stringify(payload.body))}`);
  }

  return lines.join(" \\\n");
}
