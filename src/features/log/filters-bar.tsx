import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EMPTY_FILTERS } from "@/lib/query-state"
import { STATUSES, type Filters } from "@/lib/types"

const ALL = "all"

interface FiltersBarProps {
  filters: Filters
  models: readonly string[]
  onChange: (filters: Filters) => void
}

export function FiltersBar({ filters, models, onChange }: FiltersBarProps) {
  const modelItems: Record<string, string> = { [ALL]: "Все модели" }
  for (const m of models) modelItems[m] = m
  const statusItems: Record<string, string> = { [ALL]: "Любой статус" }
  for (const s of STATUSES) statusItems[String(s)] = String(s)

  const hasFilters =
    filters.model !== "" || filters.status !== null || filters.from !== "" || filters.to !== ""
  const rangeInvalid = filters.from !== "" && filters.to !== "" && filters.from > filters.to

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
      <div className="grid gap-1.5">
        <Label>Модель</Label>
        <Select
          items={modelItems}
          value={filters.model || ALL}
          onValueChange={(v) => onChange({ ...filters, model: !v || v === ALL ? "" : v })}
        >
          <SelectTrigger className="w-full" aria-label="Модель">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(modelItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>Статус</Label>
        <Select
          items={statusItems}
          value={filters.status === null ? ALL : String(filters.status)}
          onValueChange={(v) => {
            const status = STATUSES.find((s) => String(s) === v) ?? null
            onChange({ ...filters, status })
          }}
        >
          <SelectTrigger className="w-full" aria-label="Статус">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-from">С даты (UTC)</Label>
        <Input
          id="filter-from"
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="filter-to">По дату (UTC)</Label>
        <Input
          id="filter-to"
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(e) => onChange({ ...filters, to: e.target.value })}
        />
      </div>

      <Button
        variant="outline"
        disabled={!hasFilters}
        onClick={() => onChange(EMPTY_FILTERS)}
        className="sm:col-span-2 lg:col-span-1"
      >
        <X /> Сбросить
      </Button>

      {rangeInvalid && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2 lg:col-span-5">
          Начальная дата позже конечной: под такой диапазон записей нет.
        </p>
      )}
    </div>
  )
}
