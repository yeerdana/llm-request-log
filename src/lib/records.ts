import type { Filters, LatencyPoint, LogRecord, SortState, Totals } from "./types"

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

/** Начало дня YYYY-MM-DD в UTC, мс. Для некорректной строки — NaN. */
export function dayStart(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

export function filterRecords(records: readonly LogRecord[], filters: Filters): LogRecord[] {
  const from = filters.from ? dayStart(filters.from) : -Infinity
  // «по» включительно: до конца этого дня
  const to = filters.to ? dayStart(filters.to) + DAY_MS : Infinity
  return records.filter((r) => {
    if (filters.model && r.model !== filters.model) return false
    if (filters.status !== null && r.status !== filters.status) return false
    const t = Date.parse(r.timestamp)
    return t >= from && t < to
  })
}

export function sortRecords(records: readonly LogRecord[], sort: SortState): LogRecord[] {
  const sign = sort.dir === "asc" ? 1 : -1
  const value = (r: LogRecord): number =>
    sort.key === "timestamp" ? Date.parse(r.timestamp) : r[sort.key]
  // при равенстве — по id, чтобы порядок был стабильным и предсказуемым
  return [...records].sort((a, b) => sign * (value(a) - value(b)) || sign * a.id.localeCompare(b.id))
}

export function computeTotals(records: readonly LogRecord[]): Totals {
  const count = records.length
  if (count === 0) return { count: 0, errorRate: 0, avgLatencyMs: 0, totalCostUsd: 0 }
  let errors = 0
  let latency = 0
  let cost = 0
  for (const r of records) {
    if (r.status !== 200) errors += 1
    latency += r.latency_ms
    cost += r.cost_usd
  }
  return { count, errorRate: errors / count, avgLatencyMs: latency / count, totalCostUsd: cost }
}

/** Средняя задержка по часовым интервалам (UTC), по возрастанию времени. */
export function latencySeries(records: readonly LogRecord[]): LatencyPoint[] {
  const buckets = new Map<number, { sum: number; count: number }>()
  for (const r of records) {
    const time = Math.floor(Date.parse(r.timestamp) / HOUR_MS) * HOUR_MS
    const b = buckets.get(time) ?? { sum: 0, count: 0 }
    b.sum += r.latency_ms
    b.count += 1
    buckets.set(time, b)
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, b]) => ({ time, avgLatencyMs: b.sum / b.count, count: b.count }))
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, page), pageCount)
  return {
    page: current,
    pageCount,
    items: items.slice((current - 1) * pageSize, current * pageSize),
  }
}

export function uniqueModels(records: readonly LogRecord[]): string[] {
  return [...new Set(records.map((r) => r.model))].sort()
}
