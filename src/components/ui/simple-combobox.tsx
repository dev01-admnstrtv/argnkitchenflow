import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface ComboboxOption {
  value: string
  label: string
  search?: string
}

interface SimpleComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function SimpleCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione uma opção...",
  emptyText = "Nenhuma opção encontrada.",
  searchPlaceholder = "Pesquisar...",
  className,
  disabled = false,
}: SimpleComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      option.search?.toLowerCase().includes(searchValue.toLowerCase()) ||
      option.value.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  const selectedOption = options.find((option) => option.value === value)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearchValue("")
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSelectOption = (optionValue: string) => {
    onValueChange?.(optionValue)
    setOpen(false)
    setSearchValue("")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        ref={buttonRef}
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full justify-between bg-white border-gray-300 text-gray-900 hover:bg-gray-50",
          !value && "text-gray-500",
          className
        )}
        disabled={disabled}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={cn(
            "ml-2 h-4 w-4 shrink-0 transition-transform duration-200",
            open && "transform rotate-180"
          )} 
        />
      </Button>
      
      {open && (
        <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center"
                  onClick={() => handleSelectOption(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100 text-blue-600" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}