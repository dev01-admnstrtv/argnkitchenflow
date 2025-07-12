'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleProps {
  children: React.ReactNode
  title: string
  defaultOpen?: boolean
  itemCount?: number
  className?: string
}

export function Collapsible({ 
  children, 
  title, 
  defaultOpen = false, 
  itemCount,
  className = ''
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-medium text-gray-900">{title}</h3>
          {itemCount !== undefined && (
            <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </span>
          )}
        </div>
        <ChevronDown 
          className={cn(
            'h-4 w-4 text-gray-500 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      
      {isOpen && (
        <div className="p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

interface CollapsibleGroupProps {
  children: React.ReactNode
  className?: string
}

export function CollapsibleGroup({ children, className = '' }: CollapsibleGroupProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  )
}