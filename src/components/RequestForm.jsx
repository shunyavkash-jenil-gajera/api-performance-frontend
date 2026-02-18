import { useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import Editor from "@monaco-editor/react";

import AuthSection from "@/components/AuthSection";
import HeadersSection from "@/components/HeadersSection";
import ParamsSection from "@/components/ParamsSection";
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

const EMPTY_KEY_VALUE = { key: "", value: "" };
const TAB_LIST = ["Params", "Headers", "Body", "Auth"];

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
  const [bodyText, setBodyText] = useState("{\n  \n}");
  const [auth, setAuth] = useState({
    type: "none",
    bearerToken: "",
    username: "",
    password: "",
    cookie: "",
  });
  const [formError, setFormError] = useState("");

  const jsonError = useMemo(() => {
    if (method === "GET" || !bodyText.trim()) return "";
    try {
      JSON.parse(bodyText);
      return "";
    } catch (error) {
      return error.message;
    }
  }, [method, bodyText]);

  const normalizePairs = (pairs) =>
    pairs
      .map((item) => ({
        key: String(item.key || "").trim(),
        value: item.value ?? "",
      }))
      .filter((item) => item.key);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(bodyText);
      setBodyText(JSON.stringify(parsed, null, 2));
      setFormError("");
    } catch {
      setFormError("Cannot format invalid JSON.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!url.trim()) {
      setFormError("URL is required.");
      return;
    }

    if (jsonError) {
      setFormError("Body JSON is invalid. Please fix before sending.");
      return;
    }

    let parsedBody;
    if (method !== "GET" && bodyText.trim()) {
      parsedBody = JSON.parse(bodyText);
    }

    onSubmit({
      version,
      url: url.trim(),
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
              onChange={(event) => setUrl(event.target.value)}
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

                {method === "GET" ? (
                  <p className="text-xs text-slate-400">
                    GET requests do not include a body.
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
            only with live/public URLs. <br />
            Localhost URLs will not work. <br />
            If you want to test a local server, first expose it using GitHub
            port forwarding or a tunneling service (like ngrok), then use the
            generated public URL in this tool.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
