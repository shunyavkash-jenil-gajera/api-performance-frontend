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

  const method = String(payload.method || "GET").toUpperCase();
  const canHaveBody = method !== "GET" || payload.allowGetBody;

  const hasBody =
    canHaveBody &&
    payload.body !== undefined &&
    !(method === "GET" && payload.body && Object.keys(payload.body).length === 0);

  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const lines =
    method === "GET"
      ? [`curl --location ${shellQuote(urlWithParams)}`]
      : [`curl --location -X ${method} ${shellQuote(urlWithParams)}`];

  Object.entries(headers).forEach(([key, value]) => {
    lines.push(`  -H ${shellQuote(`${key}: ${value ?? ""}`)}`);
  });

  if (payload.auth?.type === "cookie" && payload.auth.cookie) {
    lines.push(`  --cookie ${shellQuote(payload.auth.cookie)}`);
  }

  if (hasBody) {
    lines.push(`  --data-raw ${shellQuote(JSON.stringify(payload.body))}`);
  }

  return lines.join(" \\\n");
}
