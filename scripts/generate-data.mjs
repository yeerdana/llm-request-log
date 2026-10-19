// Генератор тестовых данных: детерминированный (фиксированный seed и фиксированная дата начала).
// Запуск: npm run generate-data  →  public/data/requests.json
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const SEED = 20261012
const COUNT = 600
const DAYS = 14
const START = Date.parse("2026-09-28T00:00:00Z")

// цена в $ за 1 млн токенов: [вход, выход]; медианная задержка в мс
const MODELS = [
  { name: "gpt-4o", price: [2.5, 10], latency: 900, weight: 3 },
  { name: "gpt-4o-mini", price: [0.15, 0.6], latency: 450, weight: 4 },
  { name: "claude-sonnet", price: [3, 15], latency: 1100, weight: 3 },
  { name: "claude-haiku", price: [0.8, 4], latency: 500, weight: 3 },
  { name: "llama-3-70b", price: [0.9, 0.9], latency: 700, weight: 2 },
  { name: "gemini-flash", price: [0.3, 2.5], latency: 400, weight: 2 },
]

// mulberry32: маленький детерминированный ГПСЧ
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = rng(SEED)
const normal = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())
const lognormal = (median, sigma) => median * Math.exp(sigma * normal())

function pickModel() {
  const total = MODELS.reduce((s, m) => s + m.weight, 0)
  let x = rand() * total
  for (const m of MODELS) {
    x -= m.weight
    if (x < 0) return m
  }
  return MODELS[0]
}

const times = Array.from({ length: COUNT }, () => START + Math.floor(rand() * DAYS * 86_400_000)).sort(
  (a, b) => a - b,
)

const records = times.map((ts, i) => {
  const model = pickModel()
  const r = rand()
  const status = r < 0.92 ? 200 : r < 0.96 ? 429 : 500
  const inputTokens = Math.max(5, Math.round(lognormal(450, 0.9)))
  // Из ошибочных запросов модель ничего не вернула, и стоить они ничего не должны.
  const outputTokens = status === 200 ? Math.max(1, Math.round(lognormal(260, 0.8))) : 0
  const latencyBase = status === 429 ? 60 : status === 500 ? model.latency * 2.5 : model.latency
  const latency = Math.max(20, Math.round(lognormal(latencyBase, 0.35) + outputTokens * 1.2))
  const cost =
    status === 200 ? (inputTokens * model.price[0] + outputTokens * model.price[1]) / 1_000_000 : 0
  return {
    id: `req_${String(i + 1).padStart(4, "0")}`,
    timestamp: new Date(ts).toISOString(),
    model: model.name,
    status,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    latency_ms: latency,
    cost_usd: Number(cost.toFixed(6)),
  }
})

const out = resolve(dirname(fileURLToPath(import.meta.url)), "../public/data/requests.json")
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(records, null, 1) + "\n")
console.log(`Записано ${records.length} записей → ${out}`)
