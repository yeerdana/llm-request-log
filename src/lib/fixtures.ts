import type { LogRecord } from "./types"

export function rec(overrides: Partial<LogRecord> & { id: string }): LogRecord {
  return {
    timestamp: "2026-10-01T12:00:00.000Z",
    model: "gpt-4o",
    status: 200,
    input_tokens: 100,
    output_tokens: 50,
    latency_ms: 1000,
    cost_usd: 0.01,
    ...overrides,
  }
}
