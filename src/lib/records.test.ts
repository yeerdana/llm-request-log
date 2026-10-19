import { describe, expect, it } from "vitest"
import { EMPTY_FILTERS } from "./query-state"
import { rec } from "./fixtures"
import { computeTotals, filterRecords, latencySeries, paginate, sortRecords, uniqueModels } from "./records"

const data = [
  rec({ id: "a", timestamp: "2026-10-01T00:00:00.000Z", model: "gpt-4o", status: 200, latency_ms: 800, cost_usd: 0.02 }),
  rec({ id: "b", timestamp: "2026-10-01T23:59:59.999Z", model: "gpt-4o-mini", status: 429, latency_ms: 50, cost_usd: 0 }),
  rec({ id: "c", timestamp: "2026-10-02T00:00:00.000Z", model: "gpt-4o", status: 500, latency_ms: 2500, cost_usd: 0 }),
  rec({ id: "d", timestamp: "2026-10-03T10:30:00.000Z", model: "claude-haiku", status: 200, latency_ms: 450, cost_usd: 0.005 }),
]
const ids = (rs: { id: string }[]) => rs.map((r) => r.id)

describe("filterRecords", () => {
  it("без фильтров возвращает всё", () => {
    expect(filterRecords(data, EMPTY_FILTERS)).toHaveLength(4)
  })
  it("по модели", () => {
    expect(ids(filterRecords(data, { ...EMPTY_FILTERS, model: "gpt-4o" }))).toEqual(["a", "c"])
  })
  it("по статусу", () => {
    expect(ids(filterRecords(data, { ...EMPTY_FILTERS, status: 200 }))).toEqual(["a", "d"])
  })
  it("граница «по» включает весь день, «с» начинается в 00:00 UTC", () => {
    expect(ids(filterRecords(data, { ...EMPTY_FILTERS, to: "2026-10-01" }))).toEqual(["a", "b"])
    expect(ids(filterRecords(data, { ...EMPTY_FILTERS, from: "2026-10-02" }))).toEqual(["c", "d"])
    expect(ids(filterRecords(data, { ...EMPTY_FILTERS, from: "2026-10-02", to: "2026-10-02" }))).toEqual(["c"])
  })
  it("фильтры комбинируются через И", () => {
    expect(ids(filterRecords(data, { model: "gpt-4o", status: 500, from: "2026-10-02", to: "" }))).toEqual(["c"])
  })
  it("перевёрнутый диапазон даёт пустой результат", () => {
    expect(filterRecords(data, { ...EMPTY_FILTERS, from: "2026-10-03", to: "2026-10-01" })).toEqual([])
  })
  it("не мутирует исходный массив", () => {
    const copy = [...data]
    filterRecords(data, { ...EMPTY_FILTERS, status: 500 })
    expect(data).toEqual(copy)
  })
})

describe("sortRecords", () => {
  it("по времени", () => {
    expect(ids(sortRecords(data, { key: "timestamp", dir: "desc" }))).toEqual(["d", "c", "b", "a"])
    expect(ids(sortRecords(data, { key: "timestamp", dir: "asc" }))).toEqual(["a", "b", "c", "d"])
  })
  it("по задержке", () => {
    expect(ids(sortRecords(data, { key: "latency_ms", dir: "desc" }))).toEqual(["c", "a", "d", "b"])
  })
  it("по стоимости: равные значения упорядочены по id", () => {
    expect(ids(sortRecords(data, { key: "cost_usd", dir: "asc" }))).toEqual(["b", "c", "d", "a"])
    expect(ids(sortRecords(data, { key: "cost_usd", dir: "desc" }))).toEqual(["a", "d", "c", "b"])
  })
  it("не мутирует исходный массив", () => {
    const copy = [...data]
    sortRecords(data, { key: "latency_ms", dir: "asc" })
    expect(data).toEqual(copy)
  })
})

describe("computeTotals", () => {
  it("считает число, долю ошибок, среднюю задержку и сумму", () => {
    const t = computeTotals(data)
    expect(t.count).toBe(4)
    expect(t.errorRate).toBe(0.5)
    expect(t.avgLatencyMs).toBe((800 + 50 + 2500 + 450) / 4)
    expect(t.totalCostUsd).toBeCloseTo(0.025, 10)
  })
  it("пустой список не даёт NaN", () => {
    expect(computeTotals([])).toEqual({ count: 0, errorRate: 0, avgLatencyMs: 0, totalCostUsd: 0 })
  })
  it("429 и 500 считаются ошибками, 200 нет", () => {
    expect(computeTotals([data[0]]).errorRate).toBe(0)
    expect(computeTotals([data[1]]).errorRate).toBe(1)
    expect(computeTotals([data[2]]).errorRate).toBe(1)
  })
})

describe("latencySeries", () => {
  it("усредняет по часам и сортирует по времени", () => {
    const s = latencySeries([
      rec({ id: "1", timestamp: "2026-10-01T11:10:00Z", latency_ms: 100 }),
      rec({ id: "2", timestamp: "2026-10-01T10:59:00Z", latency_ms: 40 }),
      rec({ id: "3", timestamp: "2026-10-01T11:50:00Z", latency_ms: 300 }),
    ])
    expect(s).toEqual([
      { time: Date.parse("2026-10-01T10:00:00Z"), avgLatencyMs: 40, count: 1 },
      { time: Date.parse("2026-10-01T11:00:00Z"), avgLatencyMs: 200, count: 2 },
    ])
  })
  it("пустой ввод даёт пустой ряд", () => {
    expect(latencySeries([])).toEqual([])
  })
})

describe("paginate / uniqueModels", () => {
  const items = Array.from({ length: 45 }, (_, i) => i)
  it("режет на страницы", () => {
    expect(paginate(items, 1, 20).items).toHaveLength(20)
    expect(paginate(items, 3, 20)).toMatchObject({ page: 3, pageCount: 3, items: [40, 41, 42, 43, 44] })
  })
  it("страница вне диапазона зажимается", () => {
    expect(paginate(items, 99, 20).page).toBe(3)
    expect(paginate(items, -5, 20).page).toBe(1)
    expect(paginate([], 4, 20)).toMatchObject({ page: 1, pageCount: 1, items: [] })
  })
  it("модели уникальны и отсортированы", () => {
    expect(uniqueModels(data)).toEqual(["claude-haiku", "gpt-4o", "gpt-4o-mini"])
  })
})
