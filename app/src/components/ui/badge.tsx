import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/50": variant === "default",
          "border-transparent bg-purple-500/20 text-purple-300 border-purple-500/30": variant === "secondary",
          "border-transparent bg-red-500/20 text-red-300 border-red-500/30": variant === "destructive",
          "border-white/20 text-foreground glass": variant === "outline",
          "border-transparent bg-green-500/20 text-green-300 border-green-500/30": variant === "success",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
