export const STATUSES = [200, 429, 500] as const
export type Status = (typeof STATUSES)[number]

export interface LogRecord {
  id: string
  timestamp: string // ISO 8601, UTC
  model: string
  status: Status
  input_tokens: number
  output_tokens: number
  latency_ms: number
  cost_usd: number
}

export interface Filters {
  /** Название модели; пустая строка = все модели. */
  model: string
  status: Status | null
  /** Даты YYYY-MM-DD (UTC), границы включительно; пустая строка = без границы. */
  from: string
  to: string
}

export const SORT_KEYS = ["timestamp", "latency_ms", "cost_usd"] as const
export type SortKey = (typeof SORT_KEYS)[number]
export type SortDir = "asc" | "desc"

export interface SortState {
  key: SortKey
  dir: SortDir
}

export interface Totals {
  count: number
  errorRate: number // доля ответов не 200, 0..1
  avgLatencyMs: number
  totalCostUsd: number
}

export interface LatencyPoint {
  /** Начало часового интервала, мс с эпохи (UTC). */
  time: number
  avgLatencyMs: number
  count: number
}
