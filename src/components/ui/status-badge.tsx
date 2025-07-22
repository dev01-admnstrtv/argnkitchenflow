import * as React from "react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'accent'
  size?: 'default' | 'sm' | 'lg'
  dot?: boolean
}

export function StatusBadge({ 
  className, 
  variant = 'default', 
  size = 'default',
  dot = false,
  children,
  ...props 
}: StatusBadgeProps) {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    secondary: "bg-secondary text-secondary-foreground border-border",
    accent: "bg-accent/10 text-accent-foreground border-accent/20"
  }

  const sizes = {
    default: "px-3 py-1 text-xs",
    sm: "px-2 py-0.5 text-xs",
    lg: "px-4 py-2 text-sm"
  }

  const dotColors = {
    default: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
    secondary: "bg-secondary-foreground",
    accent: "bg-accent-foreground"
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <div 
          className={cn(
            "w-2 h-2 rounded-full animate-pulse-soft",
            dotColors[variant]
          )}
        />
      )}
      {children}
    </div>
  )
}

export type { StatusBadgeProps }