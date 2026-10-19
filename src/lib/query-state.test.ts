import { describe, expect, it } from "vitest"
import { DEFAULT_SORT, EMPTY_FILTERS, parseQueryState, serializeQueryState } from "./query-state"

describe("parseQueryState", () => {
  it("пустой URL даёт значения по умолчанию", () => {
    expect(parseQueryState("")).toEqual({ filters: EMPTY_FILTERS, sort: DEFAULT_SORT, page: 1 })
  })
  it("разбирает все параметры", () => {
    expect(parseQueryState("?model=gpt-4o&status=429&from=2026-10-01&to=2026-10-05&sort=-latency_ms&page=3")).toEqual({
      filters: { model: "gpt-4o", status: 429, from: "2026-10-01", to: "2026-10-05" },
      sort: { key: "latency_ms", dir: "desc" },
      page: 3,
    })
  })
  it("sort без минуса означает по возрастанию", () => {
    expect(parseQueryState("sort=cost_usd").sort).toEqual({ key: "cost_usd", dir: "asc" })
  })
  it("мусорные значения заменяются значениями по умолчанию", () => {
    const s = parseQueryState("status=418&from=вчера&to=2026-13-45&sort=hack&page=-2")
    expect(s).toEqual({ filters: EMPTY_FILTERS, sort: DEFAULT_SORT, page: 1 })
    expect(parseQueryState("page=abc").page).toBe(1)
    expect(parseQueryState("page=2.7").page).toBe(2)
  })
})

describe("serializeQueryState", () => {
  it("значения по умолчанию не попадают в URL", () => {
    expect(serializeQueryState({ filters: EMPTY_FILTERS, sort: DEFAULT_SORT, page: 1 })).toBe("")
  })
  it("round-trip: serialize, затем parse возвращает то же состояние", () => {
    const state = {
      filters: { model: "claude haiku/4", status: 500 as const, from: "2026-10-01", to: "" },
      sort: { key: "cost_usd" as const, dir: "desc" as const },
      page: 4,
    }
    expect(parseQueryState(serializeQueryState(state))).toEqual(state)
  })
})
