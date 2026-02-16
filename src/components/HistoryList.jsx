import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function getStatusClass(status) {
  if (status >= 200 && status < 300) return 'bg-green-600 hover:bg-green-600'
  if (status >= 400) return 'bg-red-600 hover:bg-red-600'
  return 'bg-yellow-500 hover:bg-yellow-500 text-black'
}

export default function HistoryList({ history }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>Last {history.length} API tests from local storage.</CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history available yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>URL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.createdAt).toLocaleTimeString()}</TableCell>
                  <TableCell>{item.method}</TableCell>
                  <TableCell>
                    <Badge className={getStatusClass(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>{item.responseTimeMs} ms</TableCell>
                  <TableCell className="max-w-[220px] truncate" title={item.url}>
                    {item.url}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
