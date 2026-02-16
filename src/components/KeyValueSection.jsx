import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const EMPTY_ROW = { key: '', value: '' }

export default function KeyValueSection({
  title,
  description,
  rows,
  onChange,
  keySuggestions = [],
}) {
  const suggestionsId = `${title.toLowerCase().replace(/\s+/g, '-')}-suggestions`

  const updateRow = (index, field, value) => {
    const next = rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    onChange(next)
  }

  const addRow = () => {
    onChange([...(rows || []), { ...EMPTY_ROW }])
  }

  const removeRow = (index) => {
    const next = rows.filter((_, i) => i !== index)
    onChange(next.length ? next : [{ ...EMPTY_ROW }])
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {(rows || []).map((row, index) => (
        <div className="grid grid-cols-12 gap-1.5" key={`${title}-${index}`}>
          <Input
            className="col-span-5 h-8 text-xs"
            placeholder="Key"
            list={keySuggestions.length ? suggestionsId : undefined}
            value={row.key}
            onChange={(event) => updateRow(index, 'key', event.target.value)}
          />
          <Input
            className="col-span-6 h-8 text-xs"
            placeholder="Value"
            value={row.value}
            onChange={(event) => updateRow(index, 'value', event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="col-span-1 h-8 w-8"
            onClick={() => removeRow(index)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      {keySuggestions.length ? (
        <datalist id={suggestionsId}>
          {keySuggestions.map((item) => (
            <option value={item} key={item} />
          ))}
        </datalist>
      ) : null}

      <Button type="button" variant="secondary" size="sm" onClick={addRow}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add Row
      </Button>
    </div>
  )
}
