import { useEffect, useMemo, useState } from "react";

import RequestForm from "@/components/RequestForm";
import ResponseViewer from "@/components/ResponseViewer";
import { testApiRequest } from "@/services/apiTesterService";
import { getHistory, saveHistory } from "@/services/historyService";

const MAX_HISTORY = 20;

export default function HomePage() {
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    setHistory(getHistory());
  }, []);

  const urlSuggestions = useMemo(
    () =>
      [...new Set(history.map((item) => item.url).filter(Boolean))].slice(
        0,
        20,
      ),
    [history],
  );

  const addToHistory = (entry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  };

  const handleSubmit = async (payload) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await testApiRequest(payload);
      setResult(response);

      addToHistory({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        method: payload.method,
        status: response.status,
        responseTimeMs: response.responseTimeMs,
        url: payload.url,
      });
    } catch (requestError) {
      const normalizedResult = requestError.normalizedResult;
      const message =
        normalizedResult?.error ||
        requestError.response?.data?.error ||
        requestError.message ||
        "Request failed";
      setError(message);

      const responseData = requestError.response?.data;
      const failurePayload =
        normalizedResult ||
        (responseData &&
        typeof responseData === "object" &&
        ("status" in responseData ||
          "responseTimeMs" in responseData ||
          "responseHeaders" in responseData ||
          "error" in responseData ||
          "data" in responseData)
          ? responseData
          : {
              status: requestError.response?.status || null,
              responseTimeMs: 0,
              responseHeaders: requestError.response?.headers || null,
              error: message,
              data: responseData ?? null,
            });

      setResult(failurePayload);

      addToHistory({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        method: payload.method,
        status: failurePayload.status || "ERR",
        responseTimeMs: failurePayload.responseTimeMs || 0,
        url: payload.url,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-[1600px] p-3">
        <div className="mb-3 border-b border-slate-800 pb-3">
          <h1 className="text-base font-semibold tracking-wide">
            API Performance Tester
          </h1>
          <p className="text-xs text-slate-400">
            Postman-style request builder with timing, headers, auth, and JSON
            tooling.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <RequestForm
              isLoading={isLoading}
              onSubmit={handleSubmit}
              urlSuggestions={urlSuggestions}
            />
          </div>
          <div className="lg:col-span-7">
            <ResponseViewer result={result} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
}
