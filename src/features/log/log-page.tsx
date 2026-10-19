import { lazy, Suspense, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { ModeToggle } from "@/components/mode-toggle"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueryState } from "@/hooks/use-query-state"
import { fetchRequests } from "@/lib/api"
import { EMPTY_FILTERS } from "@/lib/query-state"
import {
  computeTotals,
  filterRecords,
  latencySeries,
  paginate,
  sortRecords,
  uniqueModels,
} from "@/lib/records"
import type { Filters, SortKey } from "@/lib/types"
import { FiltersBar } from "./filters-bar"
import { RequestsTable } from "./requests-table"
import { EmptyState, ErrorState, TableSkeleton } from "./states"
import { SummaryCards } from "./summary-cards"

export const PAGE_SIZE = 20

// Recharts is the heaviest dependency; load it in a separate chunk.
const LatencyChart = lazy(() =>
  import("./latency-chart").then((m) => ({ default: m.LatencyChart })),
)

export function LogPage() {
  const [state, setState] = useQueryState()
  const { filters, sort } = state
  const query = useQuery({ queryKey: ["requests"], queryFn: fetchRequests, retry: false })

  const records = query.data
  const models = useMemo(() => (records ? uniqueModels(records) : []), [records])
  const filtered = useMemo(() => (records ? filterRecords(records, filters) : null), [records, filters])
  const totals = useMemo(() => (filtered ? computeTotals(filtered) : null), [filtered])
  const series = useMemo(() => (filtered ? latencySeries(filtered) : null), [filtered])
  const sorted = useMemo(() => (filtered ? sortRecords(filtered, sort) : null), [filtered, sort])
  const pageData = useMemo(() => (sorted ? paginate(sorted, state.page, PAGE_SIZE) : null), [sorted, state.page])

  // любое изменение фильтров возвращает на первую страницу
  const setFilters = (next: Filters) => setState({ ...state, filters: next, page: 1 })
  const setSort = (key: SortKey) =>
    setState({
      ...state,
      sort: { key, dir: sort.key === key && sort.dir === "desc" ? "asc" : "desc" },
      page: 1,
    })

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:py-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Журнал запросов к LLM</h1>
          <p className="text-sm text-muted-foreground">Запросы через API-шлюз: статус, задержка, стоимость</p>
        </div>
        <ModeToggle />
      </header>

      {query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <FiltersBar filters={filters} models={models} onChange={setFilters} />
          <SummaryCards totals={totals} />
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl" />}>
            <LatencyChart points={series} />
          </Suspense>
          {pageData === null || sorted === null ? (
            <Card>
              <TableSkeleton />
            </Card>
          ) : sorted.length === 0 ? (
            <Card>
              <EmptyState
                onReset={
                  JSON.stringify(filters) === JSON.stringify(EMPTY_FILTERS)
                    ? undefined
                    : () => setFilters(EMPTY_FILTERS)
                }
              />
            </Card>
          ) : (
            <RequestsTable
              rows={pageData.items}
              sort={sort}
              onSort={setSort}
              page={pageData.page}
              pageCount={pageData.pageCount}
              total={sorted.length}
              pageSize={PAGE_SIZE}
              onPage={(page) => setState({ ...state, page })}
            />
          )}
        </>
      )}
    </div>
  )
}
