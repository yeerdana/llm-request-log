import {
  SORT_KEYS,
  STATUSES,
  type Filters,
  type SortKey,
  type SortState,
  type Status,
} from "./types"

export const DEFAULT_SORT: SortState = { key: "timestamp", dir: "desc" }
export const EMPTY_FILTERS: Filters = { model: "", status: null, from: "", to: "" }

export interface QueryState {
  filters: Filters
  sort: SortState
  page: number
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function validDate(value: string | null): string {
  if (!value || !DATE_RE.test(value)) return ""
  return Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? "" : value
}

function isStatus(n: number): n is Status {
  return (STATUSES as readonly number[]).includes(n)
}

function isSortKey(value: string): value is SortKey {
  return (SORT_KEYS as readonly string[]).includes(value)
}

/** Разбирает ?model=&status=&from=&to=&sort=&page=; мусор молча заменяется значениями по умолчанию. */
export function parseQueryState(search: string): QueryState {
  const params = new URLSearchParams(search)

  const statusNum = Number(params.get("status"))
  const filters: Filters = {
    model: params.get("model") ?? "",
    status: params.get("status") && isStatus(statusNum) ? statusNum : null,
    from: validDate(params.get("from")),
    to: validDate(params.get("to")),
  }

  // sort=-latency_ms (минус = по убыванию), sort=cost_usd (по возрастанию)
  const rawSort = params.get("sort") ?? ""
  const key = rawSort.replace(/^-/, "")
  const sort: SortState = isSortKey(key)
    ? { key, dir: rawSort.startsWith("-") ? "desc" : "asc" }
    : DEFAULT_SORT

  const pageNum = Math.floor(Number(params.get("page")))
  const page = Number.isFinite(pageNum) && pageNum >= 1 ? pageNum : 1

  return { filters, sort, page }
}

/** Обратная операция: значения по умолчанию в URL не пишутся, чтобы ссылки были короткими. */
export function serializeQueryState({ filters, sort, page }: QueryState): string {
  const params = new URLSearchParams()
  if (filters.model) params.set("model", filters.model)
  if (filters.status !== null) params.set("status", String(filters.status))
  if (filters.from) params.set("from", filters.from)
  if (filters.to) params.set("to", filters.to)
  if (sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) {
    params.set("sort", `${sort.dir === "desc" ? "-" : ""}${sort.key}`)
  }
  if (page > 1) params.set("page", String(page))
  return params.toString()
}
