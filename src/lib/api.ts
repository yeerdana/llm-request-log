import { STATUSES, type LogRecord, type Status } from "./types"

/** Имитация сетевой задержки, мс. */
export const FAKE_LATENCY_MS = 700

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isStatus(value: unknown): value is Status {
  return typeof value === "number" && (STATUSES as readonly number[]).includes(value)
}

export function parseRecords(json: unknown): LogRecord[] {
  if (!Array.isArray(json)) throw new Error("Неверный формат данных: ожидался массив")
  return json.map((item: unknown, i) => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.timestamp !== "string" ||
      typeof item.model !== "string" ||
      !isStatus(item.status) ||
      typeof item.input_tokens !== "number" ||
      typeof item.output_tokens !== "number" ||
      typeof item.latency_ms !== "number" ||
      typeof item.cost_usd !== "number"
    ) {
      throw new Error(`Неверный формат записи №${i + 1}`)
    }
    return {
      id: item.id,
      timestamp: item.timestamp,
      model: item.model,
      status: item.status,
      input_tokens: item.input_tokens,
      output_tokens: item.output_tokens,
      latency_ms: item.latency_ms,
      cost_usd: item.cost_usd,
    }
  })
}

/**
 * Загружает журнал. Сеть имитируется задержкой; чтобы посмотреть состояние ошибки,
 * откройте страницу с параметром ?fail=1.
 */
export async function fetchRequests(): Promise<LogRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS))
  if (new URLSearchParams(window.location.search).has("fail")) {
    throw new Error("Не удалось загрузить журнал запросов (имитация ошибки сервера, 500)")
  }
  const response = await fetch(`${import.meta.env.BASE_URL}data/requests.json`)
  if (!response.ok) throw new Error(`Сервер ответил ${response.status}`)
  return parseRecords(await response.json())
}
