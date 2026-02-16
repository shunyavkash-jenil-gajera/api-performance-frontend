import KeyValueSection from '@/components/KeyValueSection'

const COMMON_HEADERS = [
  'Accept',
  'Authorization',
  'Content-Type',
  'User-Agent',
  'Cache-Control',
  'X-API-Key',
  'X-Request-ID',
  'If-None-Match',
  'Accept-Language',
  'Origin',
]

export default function HeadersSection({ headers, onChange }) {
  return (
    <KeyValueSection
      title="Headers"
      description="Define custom HTTP headers for this request."
      rows={headers}
      onChange={onChange}
      keySuggestions={COMMON_HEADERS}
    />
  )
}
