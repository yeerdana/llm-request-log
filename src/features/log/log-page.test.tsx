import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fetchRequests } from "@/lib/api"
import { rec } from "@/lib/fixtures"
import { LogPage } from "./log-page"
import { EmptyState, ErrorState } from "./states"

vi.mock("@/lib/api", () => ({ fetchRequests: vi.fn() }))
// recharts в jsdom не умеет измерять размеры, поэтому график подменяем заглушкой
vi.mock("./latency-chart", () => ({ LatencyChart: () => null }))

const mocked = vi.mocked(fetchRequests)

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LogPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  window.history.replaceState(null, "", "/")
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
})
afterEach(() => vi.resetAllMocks())

describe("состояния", () => {
  it("ErrorState показывает сообщение и вызывает повтор", async () => {
    const onRetry = vi.fn()
    render(<ErrorState message="boom" onRetry={onRetry} />)
    expect(screen.getByText("boom")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Повторить" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
  it("EmptyState предлагает сбросить фильтры", async () => {
    const onReset = vi.fn()
    render(<EmptyState onReset={onReset} />)
    await userEvent.click(screen.getByRole("button", { name: "Сбросить фильтры" }))
    expect(onReset).toHaveBeenCalledOnce()
  })
})

describe("LogPage", () => {
  it("при ошибке загрузки показывает состояние ошибки, повтор перезагружает данные", async () => {
    mocked.mockRejectedValueOnce(new Error("сеть упала")).mockResolvedValueOnce([rec({ id: "r1" })])
    renderPage()
    expect(await screen.findByText("сеть упала")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Повторить" }))
    expect(await screen.findByText("gpt-4o")).toBeInTheDocument()
  })

  it("применяет фильтры из URL, показывает пустое состояние и сбрасывает их", async () => {
    window.history.replaceState(null, "", "/?status=500")
    mocked.mockResolvedValue([rec({ id: "r1", status: 200 })])
    renderPage()
    expect(await screen.findByText("Запросов не найдено")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Сбросить фильтры" }))
    await waitFor(() => expect(window.location.search).toBe(""))
    expect(await screen.findByText("gpt-4o")).toBeInTheDocument()
  })

  it("клик по сортировке записывается в URL", async () => {
    mocked.mockResolvedValue([rec({ id: "r1" }), rec({ id: "r2", latency_ms: 5 })])
    renderPage()
    await screen.findAllByText("gpt-4o")
    await userEvent.click(screen.getByRole("button", { name: /Задержка/ }))
    expect(window.location.search).toBe("?sort=-latency_ms")
    await userEvent.click(screen.getByRole("button", { name: /Задержка/ }))
    expect(window.location.search).toBe("?sort=latency_ms")
  })
})
