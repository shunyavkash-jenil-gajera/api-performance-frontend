import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function getHeaderValue(headers, targetName) {
  if (!headers || typeof headers !== 'object') return ''
  const target = targetName.toLowerCase()
  const matchedKey = Object.keys(headers).find((key) => key.toLowerCase() === target)
  return matchedKey ? String(headers[matchedKey] ?? '') : ''
}

function prettyPrintXml(xmlText) {
  const xml = String(xmlText ?? '').replace(/>\s*</g, '><').trim()
  if (!xml) return ''

  const parts = xml.replace(/</g, '\n<').split('\n').filter(Boolean)
  let indent = 0

  return parts
    .map((part) => {
      if (part.startsWith('</')) indent = Math.max(indent - 1, 0)
      const line = `${'  '.repeat(indent)}${part}`
      if (part.startsWith('<') && !part.startsWith('</') && !part.endsWith('/>') && !part.includes('</')) {
        indent += 1
      }
      return line
    })
    .join('\n')
}

function formatResponseBody(result) {
  if (!result) {
    return {
      language: 'json',
      contentType: '',
      text: '{\n  "message": "Run a request to inspect response body."\n}',
    }
  }

  const contentType = getHeaderValue(result.responseHeaders, 'content-type').toLowerCase()
  const payload = result.data ?? (result.error ? { error: result.error } : null)

  if (payload === null || payload === undefined) {
    return {
      language: 'json',
      contentType,
      text: '{\n  \n}',
    }
  }

  if (typeof payload === 'object' && !(payload instanceof ArrayBuffer)) {
    return {
      language: 'json',
      contentType,
      text: JSON.stringify(payload, null, 2),
    }
  }

  if (payload instanceof ArrayBuffer) {
    return {
      language: 'plaintext',
      contentType,
      text: `[Binary response: ${payload.byteLength} bytes]`,
    }
  }

  const text = String(payload)

  if (contentType.includes('json') || contentType.includes('+json')) {
    try {
      return {
        language: 'json',
        contentType,
        text: JSON.stringify(JSON.parse(text), null, 2),
      }
    } catch {
      return {
        language: 'json',
        contentType,
        text,
      }
    }
  }

  if (contentType.includes('xml')) {
    return {
      language: 'xml',
      contentType,
      text: prettyPrintXml(text),
    }
  }

  if (contentType.includes('html')) {
    return {
      language: 'html',
      contentType,
      text,
    }
  }

  if (contentType.includes('javascript')) {
    return {
      language: 'javascript',
      contentType,
      text,
    }
  }

  return {
    language: 'plaintext',
    contentType,
    text,
  }
}

function getTimeColorClass(timeMs) {
  if (timeMs < 200) return 'bg-emerald-600 hover:bg-emerald-600'
  if (timeMs <= 500) return 'bg-amber-500 hover:bg-amber-500 text-black'
  return 'bg-rose-600 hover:bg-rose-600'
}

function getStatusColorClass(status) {
  if (status >= 200 && status < 300) return 'bg-emerald-600 hover:bg-emerald-600'
  if (status >= 400) return 'bg-rose-600 hover:bg-rose-600'
  return 'bg-amber-500 hover:bg-amber-500 text-black'
}

export default function ResponseViewer({ result, error }) {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('Body')

  const formattedBody = useMemo(() => formatResponseBody(result), [result])

  const headersText = useMemo(() => {
    if (!result?.responseHeaders) return '{\n  \n}'
    return JSON.stringify(result.responseHeaders, null, 2)
  }, [result])

  const activeText = activeTab === 'Headers' ? headersText : formattedBody.text
  const activeLanguage = activeTab === 'Headers' ? 'json' : formattedBody.language

  const copyJson = async () => {
    await navigator.clipboard.writeText(activeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <Card className="h-full border-slate-800 bg-slate-950 text-slate-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-wide text-slate-200">Response</CardTitle>
          <div className="flex items-center gap-2">
            {result ? (
              <>
                <Badge className={getStatusColorClass(result.status)}>Status {result.status ?? 'ERR'}</Badge>
                <Badge className={getTimeColorClass(result.responseTimeMs || 0)}>
                  {result.responseTimeMs || 0} ms
                </Badge>
              </>
            ) : null}
            <Button size="sm" variant="outline" onClick={copyJson}>
              {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {error ? <p className="text-xs text-rose-400">{error}</p> : null}

        <div className="flex gap-1 rounded-md border border-slate-800 bg-slate-900 p-1">
          {['Body', 'Headers'].map((tab) => (
            <Button
              key={tab}
              type="button"
              size="sm"
              variant={activeTab === tab ? 'secondary' : 'ghost'}
              className="h-7 px-3 text-xs"
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        {activeTab === 'Body' && formattedBody.contentType ? (
          <p className="text-xs text-slate-400">
            Content-Type: {formattedBody.contentType}
          </p>
        ) : null}

        <Editor
          height="620px"
          defaultLanguage={activeLanguage}
          language={activeLanguage}
          theme="vs-dark"
          value={activeText}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: 'on',
            automaticLayout: true,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
          }}
        />
      </CardContent>
    </Card>
  )
}
