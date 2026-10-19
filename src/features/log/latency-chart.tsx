import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime, formatMs } from "@/lib/format"
import type { LatencyPoint } from "@/lib/types"

const config = {
  avgLatencyMs: { label: "Средняя задержка", color: "var(--chart-1)" },
} satisfies ChartConfig

const dayFormat = new Intl.DateTimeFormat("ru-RU", { timeZone: "UTC", day: "2-digit", month: "2-digit" })

interface LatencyChartProps {
  points: readonly LatencyPoint[] | null // null — загрузка
}

export function LatencyChart({ points }: LatencyChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Задержка по времени</CardTitle>
        <CardDescription>Средняя задержка по часам, UTC</CardDescription>
      </CardHeader>
      <CardContent>
        {points === null ? (
          <Skeleton className="h-56 w-full" />
        ) : points.length === 0 ? (
          <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            Нет данных для графика
          </p>
        ) : (
          <ChartContainer config={config} className="h-56 w-full">
            <LineChart data={[...points]} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t: number) => dayFormat.format(new Date(t))}
                tickLine={false}
                axisLine={false}
                minTickGap={32}
              />
              <YAxis
                width={48}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${Math.round(v)}`}
                unit=" мс"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_label, payload) => {
                      const time = payload?.[0]?.payload?.time
                      return typeof time === "number" ? formatDateTime(time) : ""
                    }}
                    formatter={(value) => (typeof value === "number" ? formatMs(value) : String(value))}
                  />
                }
              />
              <Line
                dataKey="avgLatencyMs"
                type="monotone"
                stroke="var(--color-avgLatencyMs)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
