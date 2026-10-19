import { describe, expect, it } from "vitest"
import { parseRecords } from "./api"
import { rec } from "./fixtures"

describe("parseRecords", () => {
  it("принимает корректные записи", () => {
    const r = rec({ id: "x" })
    expect(parseRecords([r])).toEqual([r])
  })
  it("отклоняет не-массив и записи с неверными полями", () => {
    expect(() => parseRecords({})).toThrow()
    expect(() => parseRecords([{ ...rec({ id: "x" }), status: 418 }])).toThrow(/№1/)
    expect(() => parseRecords([null])).toThrow()
  })
})
