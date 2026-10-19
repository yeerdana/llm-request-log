import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { LogPage } from "@/features/log/log-page"

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="llm-log-theme">
        <LogPage />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
