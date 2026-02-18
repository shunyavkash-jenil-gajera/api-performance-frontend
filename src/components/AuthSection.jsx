import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AuthSection({ auth, onChange }) {
  const update = (patch) => onChange({ ...auth, ...patch })

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Authentication</p>

      <Select value={auth.type} onValueChange={(value) => update({ type: value })}>
        <SelectTrigger className="h-8 border-slate-700 bg-slate-950 text-xs">
          <SelectValue placeholder="Select auth type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="bearer">Bearer Token</SelectItem>
          <SelectItem value="basic">Basic Auth</SelectItem>
          <SelectItem value="cookie">Cookie</SelectItem>
        </SelectContent>
      </Select>

      {auth.type === 'bearer' ? (
        <Input
          className="h-8 border-slate-700 bg-slate-950 text-xs"
          placeholder="Bearer token"
          value={auth.bearerToken}
          onChange={(event) => update({ bearerToken: event.target.value })}
        />
      ) : null}

      {auth.type === 'basic' ? (
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            className="h-8 border-slate-700 bg-slate-950 text-xs"
            placeholder="Username"
            value={auth.username}
            onChange={(event) => update({ username: event.target.value })}
          />
          <Input
            className="h-8 border-slate-700 bg-slate-950 text-xs"
            type="password"
            placeholder="Password"
            value={auth.password}
            onChange={(event) => update({ password: event.target.value })}
          />
        </div>
      ) : null}

      {auth.type === 'cookie' ? (
        <Input
          className="h-8 border-slate-700 bg-slate-950 text-xs"
          placeholder="session=abc123; theme=dark"
          value={auth.cookie}
          onChange={(event) => update({ cookie: event.target.value })}
        />
      ) : null}
    </div>
  )
}
