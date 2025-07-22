import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'accent'
  text?: string
}

export function LoadingSpinner({ 
  className,
  size = 'default',
  variant = 'default',
  text,
  ...props 
}: LoadingSpinnerProps) {
  const sizes = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }

  const variants = {
    default: "text-muted-foreground",
    primary: "text-primary",
    accent: "text-accent-foreground"
  }

  return (
    <div className={cn("flex flex-col items-center gap-3", className)} {...props}>
      <div className="relative">
        <div 
          className={cn(
            "animate-spin rounded-full border-2 border-current border-t-transparent",
            sizes[size],
            variants[variant]
          )}
        />
        <div 
          className={cn(
            "absolute inset-0 animate-ping rounded-full border border-current opacity-20",
            sizes[size],
            variants[variant]
          )}
        />
      </div>
      {text && (
        <p className={cn("text-sm font-medium", variants[variant])}>
          {text}
        </p>
      )}
    </div>
  )
}

export type { LoadingSpinnerProps }