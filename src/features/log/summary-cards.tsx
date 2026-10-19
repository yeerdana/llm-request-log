import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatInt, formatMs, formatPercent, formatUsd } from "@/lib/format"
import type { Totals } from "@/lib/types"

interface SummaryCardsProps {
  totals: Totals | null // null — данные ещё грузятся
}

export function SummaryCards({ totals }: SummaryCardsProps) {
  const items: { label: string; value: string | null }[] = [
    { label: "Запросов", value: totals && formatInt(totals.count) },
    { label: "Доля ошибок", value: totals && formatPercent(totals.errorRate) },
    { label: "Средняя задержка", value: totals && formatMs(totals.avgLatencyMs) },
    { label: "Сумма", value: totals && formatUsd(totals.totalCostUsd, 4) },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Итоги">
      {items.map(({ label, value }) => (
        <Card key={label} size="sm">
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums sm:text-2xl">
              {value ?? <Skeleton className="h-8 w-20" />}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
