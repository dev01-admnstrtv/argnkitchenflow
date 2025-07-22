"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backHref?: string
  actions?: React.ReactNode
  className?: string
}

export function AppHeader({ 
  title, 
  subtitle, 
  showBackButton = false, 
  backHref = "/",
  actions,
  className 
}: AppHeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                asChild
                className="rounded-xl"
              >
                <Link href={backHref}>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="sr-only">Voltar</span>
                </Link>
              </Button>
            )}
            <div className="flex flex-col">
              {title && (
                <h1 className="text-heading text-foreground font-semibold">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-caption text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export type { AppHeaderProps }