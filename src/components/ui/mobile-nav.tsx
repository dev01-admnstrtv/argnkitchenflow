"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MobileNavItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: string | number
}

interface MobileNavProps {
  items: MobileNavItem[]
  className?: string
}

export function MobileNav({ items, className }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("nav-mobile", className)}>
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 flex-1",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <div className="relative">
                <div className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md scale-110" 
                    : "bg-transparent"
                )}>
                  {item.icon}
                </div>
                {item.badge && (
                  <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {item.badge}
                  </div>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium truncate w-full text-center transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export type { MobileNavItem, MobileNavProps }