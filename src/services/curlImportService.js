const EMPTY_KEY_VALUE = { key: "", value: "" };

function tokenizeShellCommand(input) {
  const text = String(input ?? "").replace(/\\\r?\n/g, " ").trim();
  const tokens = [];
  let current = "";
  let quote = null;
  let escaping = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\") {
      if (quote === "single") {
        current += char;
      } else {
        escaping = true;
      }
      continue;
    }

    if (quote === "single") {
      if (char === "'") {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (quote === "double") {
      if (char === '"') {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "'") {
      quote = "single";
      continue;
    }

    if (char === '"') {
      quote = "double";
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}

function normalizeMethod(value) {
  return String(value ?? "").trim().toUpperCase();
}

function parseHeaderLine(headerLine) {
  const separatorIndex = headerLine.indexOf(":");
  if (separatorIndex <= 0) return null;
  const key = headerLine.slice(0, separatorIndex).trim();
  const value = headerLine.slice(separatorIndex + 1).trim();
  if (!key) return null;
  return { key, value };
}

function toKeyValueRows(entries) {
  if (!entries.length) return [{ ...EMPTY_KEY_VALUE }];
  return entries.map((entry) => ({ key: entry.key, value: entry.value ?? "" }));
}

function parseUrlAndParams(rawUrl) {
  if (!rawUrl) return { url: "", params: [{ ...EMPTY_KEY_VALUE }] };

  try {
    const parsed = new URL(rawUrl);
    const params = [];
    parsed.searchParams.forEach((value, key) => {
      params.push({ key, value });
    });
    parsed.search = "";
    return { url: parsed.toString(), params: toKeyValueRows(params) };
  } catch {
    return { url: rawUrl, params: [{ ...EMPTY_KEY_VALUE }] };
  }
}

export function parseCurlCommand(input) {
  const tokens = tokenizeShellCommand(input);
  if (!tokens.length || tokens[0] !== "curl") return null;

  let method = "GET";
  let methodExplicitlySet = false;
  let url = "";
  let body = "";
  let hasBody = false;
  const headers = [];
  let auth = {
    type: "none",
    bearerToken: "",
    username: "",
    password: "",
    cookie: "",
  };

  const nextValue = (index) => tokens[index + 1];

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (!token) continue;

    if (token === "-X" || token === "--request") {
      const value = nextValue(index);
      if (value) {
        method = normalizeMethod(value) || method;
        methodExplicitlySet = true;
        index += 1;
      }
      continue;
    }

    if (token === "-I" || token === "--head") {
      method = "HEAD";
      methodExplicitlySet = true;
      continue;
    }

    if (token === "-G" || token === "--get") {
      method = "GET";
      methodExplicitlySet = true;
      continue;
    }

    if (token === "-H" || token === "--header") {
      const headerLine = nextValue(index);
      if (headerLine) {
        const parsedHeader = parseHeaderLine(headerLine);
        if (parsedHeader) headers.push(parsedHeader);
        index += 1;
      }
      continue;
    }

    if (token === "--url") {
      const value = nextValue(index);
      if (value) {
        url = value;
        index += 1;
      }
      continue;
    }

    if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary" ||
      token === "--data-urlencode"
    ) {
      const value = nextValue(index);
      if (value !== undefined) {
        body = value;
        hasBody = true;
        if (!methodExplicitlySet) method = "POST";
        index += 1;
      }
      continue;
    }

    if (token === "-b" || token === "--cookie") {
      const value = nextValue(index);
      if (value !== undefined) {
        auth = { ...auth, type: "cookie", cookie: value };
        index += 1;
      }
      continue;
    }

    if (token === "-u" || token === "--user") {
      const value = nextValue(index);
      if (value !== undefined) {
        const separatorIndex = value.indexOf(":");
        const username =
          separatorIndex >= 0 ? value.slice(0, separatorIndex) : value;
        const password = separatorIndex >= 0 ? value.slice(separatorIndex + 1) : "";
        auth = { ...auth, type: "basic", username, password };
        index += 1;
      }
      continue;
    }

    if (!token.startsWith("-") && !url) {
      url = token;
    }
  }

  const normalizedHeaders = [];
  headers.forEach((header) => {
    const lowerKey = header.key.toLowerCase();
    if (lowerKey === "authorization") {
      const bearerMatch = header.value.match(/^Bearer\s+(.+)$/i);
      const basicMatch = header.value.match(/^Basic\s+(.+)$/i);
      if (bearerMatch) {
        auth = { ...auth, type: "bearer", bearerToken: bearerMatch[1] };
        return;
      }
      if (basicMatch) {
        try {
          const decoded = atob(basicMatch[1]);
          const separatorIndex = decoded.indexOf(":");
          const username =
            separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded;
          const password =
            separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";
          auth = { ...auth, type: "basic", username, password };
          return;
        } catch {
          normalizedHeaders.push(header);
          return;
        }
      }
    }

    normalizedHeaders.push(header);
  });

  let bodyText = "{\n  \n}";
  if (hasBody) {
    try {
      bodyText = JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      bodyText = body;
    }
  }

  const { url: normalizedUrl, params } = parseUrlAndParams(url);

  return {
    method: method || "GET",
    url: normalizedUrl,
    params,
    headers: toKeyValueRows(normalizedHeaders),
    auth,
    bodyText,
  };
}
