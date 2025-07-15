"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FloatingActionButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: "default" | "secondary"
}

export function FloatingActionButton({ children, onClick, className, variant = "default" }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
        "bg-brand-500 text-white hover:bg-brand-600 active:scale-95",
        "transition-all duration-200 min-w-14 min-h-14 flex items-center justify-center",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        className,
      )}
      size="icon"
    >
      {children}
    </Button>
  )
}
