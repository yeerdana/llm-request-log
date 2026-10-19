import { AlertTriangle, SearchX } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertTriangle />
      <AlertTitle>Не удалось загрузить данные</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}

export function EmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <p className="font-medium">Запросов не найдено</p>
      <p className="text-sm text-muted-foreground">
        {onReset ? "Под выбранные фильтры ничего не подходит." : "В журнале пока нет записей."}
      </p>
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset}>
          Сбросить фильтры
        </Button>
      )}
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="grid gap-2 p-4" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  )
}
