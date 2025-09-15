"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

import { useMediaQuery } from 'react-responsive'

interface ComboboxItem {
  value: string
  label: string
}

interface ComboboxProps {
  items: ComboboxItem[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function Combobox({ items, value, onChange, placeholder = "Select an option..." }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useMediaQuery({ query: '(max-width: 640px)' });  // Add this hook if not present (from 'react-responsive' or similar)
  
  const selectedItem = items.find((item) => item.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-sm sm:text-base py-3"  // Increased padding for touch
        >
          {selectedItem ? selectedItem.label : placeholder}
          <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />  // Larger icon
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "p-0 max-h-[80vh] overflow-auto",
          isMobile ? "w-screen rounded-none border-0" : "w-[var(--radix-popover-trigger-width)]"  // Full-screen on mobile
        )}
        align="start"  // Align to start for better mobile positioning
      >
        <Command>
          <CommandInput placeholder={placeholder} className="text-base p-3" />  // Larger input text/padding
          <CommandEmpty className="p-4 text-base text-center">  // Centered, larger empty state
            No item found. Try a different keyword?
          </CommandEmpty>
          <CommandGroup>
            {items.map((item) => (
              <CommandItem
                key={item.value}
                value={item.label}
                onSelect={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                className="text-base py-3"  // Larger items for touch
              >
                <Check
                  className={cn(
                    "mr-2 h-5 w-5",
                    value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
        {isMobile && (  // Mobile-only close button
          <Button 
            variant="ghost" 
            className="w-full py-3 text-base border-t" 
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}