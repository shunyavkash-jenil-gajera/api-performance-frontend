import axios from "axios";
import { normalizeHttpUrl } from "@/lib/url";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT_MS = 35000;

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

function normalizeDirectResponse(response, responseTimeMs) {
  return {
    status: response.status,
    responseTimeMs,
    responseHeaders: response.headers || null,
    data: response.data ?? null,
    error: null,
  };
}

function createDirectErrorResult(error, responseTimeMs) {
  if (error.response) {
    return {
      status: error.response.status ?? null,
      responseTimeMs,
      responseHeaders: error.response.headers || null,
      data: error.response.data ?? null,
      error: error.message || "Request failed",
    };
  }

  return {
    status: null,
    responseTimeMs,
    responseHeaders: null,
    data: null,
    error:
      error.message ||
      "Request failed. If using Version 2, check backend CORS settings and allowed origins.",
  };
}

async function testApiRequestDirect(payload) {
  const startedAt = performance.now();
  const normalizedUrl = normalizeHttpUrl(payload.url);
  const headers = pairsToObject(payload.headers);
  applyAuthHeader(headers, payload.auth);
  const withCredentials = payload.auth?.type === "cookie";

  if (
    payload.method !== "GET" &&
    payload.body !== undefined &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await axios({
      url: normalizedUrl,
      method: payload.method,
      params: pairsToObject(payload.params),
      headers,
      data: payload.method === "GET" ? undefined : payload.body,
      withCredentials,
      timeout: REQUEST_TIMEOUT_MS,
    });

    return normalizeDirectResponse(
      response,
      Math.round(performance.now() - startedAt),
    );
  } catch (error) {
    const wrappedError = new Error(error.message || "Request failed");
    wrappedError.normalizedResult = createDirectErrorResult(
      error,
      Math.round(performance.now() - startedAt),
    );
    throw wrappedError;
  }
}

export async function testApiRequest(payload) {
  const normalizedPayload = {
    ...payload,
    url: normalizeHttpUrl(payload.url),
  };

  if (normalizedPayload.version === "v2") {
    return testApiRequestDirect(normalizedPayload);
  }

  const { version, ...proxyPayload } = normalizedPayload;
  const { data } = await axios.post(`${API_BASE_URL}/test`, proxyPayload, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
}
