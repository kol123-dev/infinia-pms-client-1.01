"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface MobileCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  swipeable?: boolean
}

interface MobileCardHeaderProps {
  title: string
  subtitle?: string
  badge?: ReactNode
  avatar?: ReactNode
}

interface MobileCardContentProps {
  children: ReactNode
  className?: string
}

interface MobileCardActionsProps {
  children: ReactNode
  className?: string
}

export function MobileCard({ children, className, onClick, swipeable }: MobileCardProps) {
  return (
    <Card
      className={cn(
        "mobile-card touch-feedback",
        swipeable && "swipeable-item",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  )
}

export function MobileCardHeader({ title, subtitle, badge, avatar }: MobileCardHeaderProps) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-start space-x-3">
        {avatar && <div className="flex-shrink-0">{avatar}</div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate text-sm sm:text-base">{title}</h3>
              {subtitle && <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">{subtitle}</p>}
            </div>
            {badge && <div className="ml-2 flex-shrink-0">{badge}</div>}
          </div>
        </div>
      </div>
    </CardHeader>
  )
}

export function MobileCardContent({ children, className }: MobileCardContentProps) {
  return <CardContent className={cn("pt-0 space-y-2", className)}>{children}</CardContent>
}

export function MobileCardActions({ children, className }: MobileCardActionsProps) {
  return <div className={cn("flex items-center space-x-2 pt-3 border-t", className)}>{children}</div>
}
