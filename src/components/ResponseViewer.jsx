import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

  const bodyText = useMemo(() => {
    if (!result) return '{\n  "message": "Run a request to inspect response body."\n}'
    const displayPayload = result.data ?? (result.error ? { error: result.error } : null)
    return JSON.stringify(displayPayload, null, 2)
  }, [result])

  const headersText = useMemo(() => {
    if (!result?.responseHeaders) return '{\n  \n}'
    return JSON.stringify(result.responseHeaders, null, 2)
  }, [result])

  const activeText = activeTab === 'Headers' ? headersText : bodyText

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

        <Editor
          height="620px"
          defaultLanguage="json"
          language="json"
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
