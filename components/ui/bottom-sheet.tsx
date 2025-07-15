"use client"

import { type ReactNode, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface BottomSheetProps {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  className?: string
}

export function BottomSheet({ children, isOpen, onClose, title, className }: BottomSheetProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 animate-fade-in" onClick={onClose} />}

      {/* Bottom Sheet */}
      <div
        className={cn(
          "bottom-sheet max-h-[80vh] overflow-y-auto",
          isOpen ? "translate-y-0" : "translate-y-full",
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="touch-target">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </>
  )
}
