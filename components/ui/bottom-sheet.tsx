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

  // Limit scroll locking to mobile; restore cleanly when closed
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768
    if (!isMobile) return

    const html = document.documentElement

    if (isOpen) {
      html.style.overflow = "hidden"
      document.body.style.overflow = "hidden"
    } else {
      html.style.overflow = ""
      document.body.style.overflow = ""
    }

    return () => {
      html.style.overflow = ""
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <>
      {/* Backdrop (mobile-only) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 animate-fade-in md:hidden"
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet (mobile-only, non-interactive when closed) */}
      <div
        className={cn(
          "bottom-sheet max-h-[80vh] overflow-y-auto md:hidden",
          isOpen ? "translate-y-0 pointer-events-auto" : "translate-y-full pointer-events-none",
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
