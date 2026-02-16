import { Textarea } from '@/components/ui/textarea'

export default function BodySection({ method, bodyText, onChange }) {
  if (method === 'GET') return null

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <p className="text-sm font-semibold">Request Body (JSON)</p>
        <p className="text-xs text-muted-foreground">Provide a valid JSON object/array for non-GET requests.</p>
      </div>
      <Textarea
        className="min-h-32"
        placeholder='{"name": "John"}'
        value={bodyText}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
