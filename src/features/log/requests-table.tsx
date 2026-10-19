import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateTime, formatInt, formatMs, formatUsd } from "@/lib/format"
import type { LogRecord, SortKey, SortState, Status } from "@/lib/types"

const STATUS_VARIANT: Record<Status, "secondary" | "outline" | "destructive"> = {
  200: "secondary",
  429: "outline",
  500: "destructive",
}

interface SortHeadProps {
  label: string
  column: SortKey
  sort: SortState
  onSort: (key: SortKey) => void
  align?: "right"
}

function SortHead({ label, column, sort, onSort, align }: SortHeadProps) {
  const active = sort.key === column
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead
      aria-sort={!active ? "none" : sort.dir === "asc" ? "ascending" : "descending"}
      className={align === "right" ? "text-right" : undefined}
    >
      <Button
        variant="ghost"
        size="sm"
        className={align === "right" ? "-mr-2.5" : "-ml-2.5"}
        onClick={() => onSort(column)}
      >
        {label}
        <Icon aria-hidden className={active ? "" : "opacity-50"} />
      </Button>
    </TableHead>
  )
}

interface RequestsTableProps {
  rows: readonly LogRecord[]
  sort: SortState
  onSort: (key: SortKey) => void
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPage: (page: number) => void
}

export function RequestsTable({
  rows,
  sort,
  onSort,
  page,
  pageCount,
  total,
  pageSize,
  onPage,
}: RequestsTableProps) {
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)
  return (
    <Card className="gap-0 py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHead label="Время (UTC)" column="timestamp" sort={sort} onSort={onSort} />
            <TableHead>Модель</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Токены вх.</TableHead>
            <TableHead className="text-right">Токены вых.</TableHead>
            <SortHead label="Задержка" column="latency_ms" sort={sort} onSort={onSort} align="right" />
            <SortHead label="Стоимость" column="cost_usd" sort={sort} onSort={onSort} align="right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap tabular-nums">{formatDateTime(r.timestamp)}</TableCell>
              <TableCell className="whitespace-nowrap font-medium">{r.model}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatInt(r.input_tokens)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatInt(r.output_tokens)}</TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">{formatMs(r.latency_ms)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatUsd(r.cost_usd)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-sm">
        <span className="text-muted-foreground">
          {first}–{last} из {formatInt(total)}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            <ChevronLeft /> Назад
          </Button>
          <span className="tabular-nums">
            {page} / {pageCount}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => onPage(page + 1)}>
            Вперёд <ChevronRight />
          </Button>
        </div>
      </div>
    </Card>
  )
}
