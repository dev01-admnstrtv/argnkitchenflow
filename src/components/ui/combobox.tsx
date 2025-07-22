import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  search?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  emptyText?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Selecione uma opção...",
  emptyText = "Nenhuma opção encontrada.",
  searchPlaceholder = "Pesquisar...",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
      option.search?.toLowerCase().includes(searchValue.toLowerCase()) ||
      option.value.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white border-gray-300 text-gray-900 hover:bg-gray-50",
            !value && "text-gray-500",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[9999]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {filteredOptions.map((option) => (
              <CommandItem
                key={option.value}
                value={option.label}
                className="cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onValueChange?.(option.value)
                  setOpen(false)
                  setSearchValue("")
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onValueChange?.(option.value)
                  setOpen(false)
                  setSearchValue("")
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}