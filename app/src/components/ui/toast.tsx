import { X } from "lucide-react"
import { cn } from "../../lib/utils"

export interface ToastProps {
  message: string
  variant?: "default" | "success" | "error" | "warning"
  onClose?: () => void
}

export function Toast({ message, variant = "default", onClose }: ToastProps) {
  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-xl animate-in slide-in-from-bottom-5",
        {
          "bg-green-500/20 border-green-500/30 text-green-300": variant === "success",
          "bg-red-500/20 border-red-500/30 text-red-300": variant === "error",
          "bg-yellow-500/20 border-yellow-500/30 text-yellow-300": variant === "warning",
          "glass border-white/20 text-foreground": variant === "default",
        }
      )}
    >
      <p className="text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
