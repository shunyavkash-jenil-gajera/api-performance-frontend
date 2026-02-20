import { useMemo, useState } from "react";
import { Check, Copy, Loader2, Send } from "lucide-react";
import Editor from "@monaco-editor/react";

import AuthSection from "@/components/AuthSection";
import HeadersSection from "@/components/HeadersSection";
import ParamsSection from "@/components/ParamsSection";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";
import { parseCurlCommand } from "@/services/curlImportService";
import { generateCurlCommand } from "@/services/curlService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const EMPTY_KEY_VALUE = { key: "", value: "" };
const TAB_LIST = ["Params", "Headers", "Body", "Auth", "cURL"];

export default function RequestForm({
  isLoading,
  onSubmit,
  urlSuggestions = [],
}) {
  const [version, setVersion] = useState("v1");
  const [url, setUrl] = useState(
    "https://jsonplaceholder.typicode.com/todos/1",
  );
  const [method, setMethod] = useState("GET");
  const [activeTab, setActiveTab] = useState("Params");
  const [params, setParams] = useState([{ ...EMPTY_KEY_VALUE }]);
  const [headers, setHeaders] = useState([{ ...EMPTY_KEY_VALUE }]);
  const [bodyText, setBodyText] = useState("");
  const [auth, setAuth] = useState({
    type: "none",
    bearerToken: "",
    username: "",
    password: "",
    cookie: "",
  });
  const [formError, setFormError] = useState("");
  const [copiedCurl, setCopiedCurl] = useState(false);
  const canSendBody = method !== "GET" || version === "v1";

  const jsonError = useMemo(() => {
    if (!canSendBody || !bodyText.trim()) return "";
    try {
      JSON.parse(bodyText);
      return "";
    } catch (error) {
      return error.message;
    }
  }, [canSendBody, bodyText]);

  const normalizePairs = (pairs) =>
    pairs
      .map((item) => ({
        key: String(item.key || "").trim(),
        value: item.value ?? "",
      }))
      .filter((item) => item.key);

  const importCurlFromText = (text) => {
    const parsed = parseCurlCommand(text);
    if (!parsed) return false;

    setMethod(parsed.method);
    setUrl(parsed.url || "");
    setParams(parsed.params);
    setHeaders(parsed.headers);
    setAuth(parsed.auth);
    setBodyText(parsed.bodyText);
    setActiveTab("Body");
    setFormError("");
    return true;
  };

  const curlCommand = useMemo(() => {
    let parsedBody;
    if (canSendBody && bodyText.trim()) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = undefined;
      }
    }

    return generateCurlCommand({
      url: normalizeHttpUrl(url),
      method,
      params: normalizePairs(params),
      headers: normalizePairs(headers),
      auth,
      body: parsedBody,
      allowGetBody: version === "v1",
    });
  }, [url, method, params, headers, auth, bodyText, canSendBody, version]);

  const copyCurl = async () => {
    await navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 1200);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(bodyText);
      setBodyText(JSON.stringify(parsed, null, 2));
      setFormError("");
    } catch {
      setFormError("Cannot format invalid JSON.");
    }
  };

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleUrlBlur = () => {
    if (!url.trim().toLowerCase().startsWith("curl")) return;
    importCurlFromText(url);
  };

  const handleUrlPaste = (event) => {
    const pastedText = event.clipboardData?.getData("text") || "";
    if (!pastedText.trim().toLowerCase().startsWith("curl")) return;
    event.preventDefault();
    importCurlFromText(pastedText);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const rawInput = String(url || "").trim();
    if (rawInput.toLowerCase().startsWith("curl")) {
      const imported = importCurlFromText(rawInput);
      if (imported) {
        setFormError("cURL imported. Review fields and click Send.");
      } else {
        setFormError("Invalid cURL command. Please check and try again.");
      }
      return;
    }

    const normalizedUrl = normalizeHttpUrl(url);

    if (!normalizedUrl) {
      setFormError("URL is required.");
      return;
    }

    if (!isHttpUrl(normalizedUrl)) {
      setFormError("URL must be a valid http:// or https:// URL.");
      return;
    }

    if (jsonError) {
      setFormError("Body JSON is invalid. Please fix before sending.");
      return;
    }

    let parsedBody;
    if (canSendBody && bodyText.trim()) {
      parsedBody = JSON.parse(bodyText);
    }

    setUrl(normalizedUrl);
    onSubmit({
      version,
      url: normalizedUrl,
      method,
      params: normalizePairs(params),
      headers: normalizePairs(headers),
      auth,
      body: parsedBody,
    });
  };

  return (
    <Card className="border-slate-800 bg-slate-950 text-slate-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold tracking-wide text-slate-200">
            Request Builder
          </CardTitle>
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-400">Version</p>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger className="h-8 w-[210px] border-slate-700 bg-slate-900 text-xs">
                <SelectValue placeholder="Select Version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">Version 1 (Proxy Backend)</SelectItem>
                <SelectItem value="v2">Version 2 (Direct Frontend)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="col-span-3 border-slate-700 bg-slate-900 text-xs">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="HEAD">HEAD</SelectItem>
                <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>

            <Input
              className="col-span-7 h-9 border-slate-700 bg-slate-900 text-xs"
              placeholder="https://api.example.com/resource"
              value={url}
              list="url-history-suggestions"
              onChange={handleUrlChange}
              onBlur={handleUrlBlur}
              onPaste={handleUrlPaste}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="col-span-2 h-9 text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Send className="mr-1 h-3.5 w-3.5" />
                  Send
                </>
              )}
            </Button>
          </div>

          <datalist id="url-history-suggestions">
            {urlSuggestions.map((item) => (
              <option value={item} key={item} />
            ))}
          </datalist>

          <div className="flex flex-wrap gap-1 rounded-md border border-slate-800 bg-slate-900 p-1">
            {TAB_LIST.map((tab) => (
              <Button
                key={tab}
                type="button"
                size="sm"
                variant={activeTab === tab ? "secondary" : "ghost"}
                className="h-7 px-3 text-xs"
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </Button>
            ))}
          </div>

          <div className="min-h-[320px] rounded-md border border-slate-800 bg-slate-900 p-3">
            {activeTab === "Params" ? (
              <ParamsSection params={params} onChange={setParams} />
            ) : null}
            {activeTab === "Headers" ? (
              <HeadersSection headers={headers} onChange={setHeaders} />
            ) : null}
            {activeTab === "Auth" ? (
              <AuthSection auth={auth} onChange={setAuth} />
            ) : null}

            {activeTab === "Body" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    JSON Body
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={formatJson}
                  >
                    Format JSON
                  </Button>
                </div>

                {!canSendBody ? (
                  <p className="text-xs text-slate-400">
                    GET request body is available in Version 1 (Proxy Backend)
                    only.
                  </p>
                ) : (
                  <Editor
                    height="240px"
                    defaultLanguage="json"
                    value={bodyText}
                    theme="vs-dark"
                    onChange={(value) => setBodyText(value || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: "on",
                      automaticLayout: true,
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                    }}
                  />
                )}

                {jsonError ? (
                  <p className="text-xs text-red-400">
                    JSON Error: {jsonError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {activeTab === "cURL" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Generated cURL Command
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={copyCurl}
                  >
                    {copiedCurl ? (
                      <Check className="mr-1 h-3.5 w-3.5" />
                    ) : (
                      <Copy className="mr-1 h-3.5 w-3.5" />
                    )}
                    {copiedCurl ? "Copied" : "Copy cURL"}
                  </Button>
                </div>
                <Textarea
                  className="min-h-[240px] border-slate-700 bg-slate-950 font-mono text-xs"
                  readOnly
                  value={curlCommand}
                />
              </div>
            ) : null}
          </div>

          {formError ? (
            <p className="text-xs text-red-400">{formError}</p>
          ) : null}
        </form>

        {version === "v2" && (
          <div className="rounded-md border border-amber-700/60 bg-amber-900/20 p-2 text-xs leading-relaxed text-amber-200">
            If you are using an API that requires CORS, make sure to whitelist{" "}
            <span className="font-semibold">
              https://api-performance-frontend.vercel.app
            </span>{" "}
            in your backend CORS configuration. This tool makes requests from
            this domain.
          </div>
        )}

        {version === "v1" && (
          <div className="rounded-md border border-blue-700/60 bg-blue-900/20 p-2 text-xs leading-relaxed text-blue-200">
            <span className="font-semibold">Important:</span> This tool works
            only with live/public URLs. Localhost URLs will not work in Version
            1.
            <br />
            <br />
            If you want to test APIs running on your local machine, please
            switch to{" "}
            <span className="font-semibold">
              Version 2 (Direct Frontend Mode)
            </span>
            . Version 2 allows you to test local APIs directly from your
            frontend environment.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
