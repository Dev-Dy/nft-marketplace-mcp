import { Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("animate-spin text-purple-500", className)} />
  )
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center">
        <LoadingSpinner className="h-12 w-12 mx-auto mb-4" />
        {message && <p className="text-muted-foreground">{message}</p>}
      </div>
    </div>
  )
}
