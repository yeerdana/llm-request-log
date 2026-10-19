import { useCallback, useMemo, useSyncExternalStore } from "react"
import { parseQueryState, serializeQueryState, type QueryState } from "@/lib/query-state"

const URL_CHANGE = "urlchange"

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange)
  window.addEventListener(URL_CHANGE, onChange)
  return () => {
    window.removeEventListener("popstate", onChange)
    window.removeEventListener(URL_CHANGE, onChange)
  }
}

const getSearch = (): string => window.location.search

/**
 * Состояние страницы (фильтры, сортировка, страница) живёт в строке запроса URL:
 * переживает перезагрузку, работает как ссылка и с кнопками «назад»/«вперёд».
 */
export function useQueryState(): [QueryState, (next: QueryState) => void] {
  const search = useSyncExternalStore(subscribe, getSearch)
  const state = useMemo(() => parseQueryState(search), [search])

  const setState = useCallback((next: QueryState) => {
    const query = serializeQueryState(next)
    const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
    if (url === `${window.location.pathname}${window.location.search}${window.location.hash}`) return
    window.history.pushState(null, "", url)
    window.dispatchEvent(new Event(URL_CHANGE))
  }, [])

  return [state, setState]
}
