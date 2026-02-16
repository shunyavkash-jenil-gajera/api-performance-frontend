import KeyValueSection from '@/components/KeyValueSection'

export default function ParamsSection({ params, onChange }) {
  return (
    <KeyValueSection
      title="Params"
      description="Query parameters appended to the URL."
      rows={params}
      onChange={onChange}
    />
  )
}
