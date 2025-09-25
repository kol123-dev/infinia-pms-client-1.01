"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/context/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { EntitySelector } from "./entity-selector"
import {
  LayoutDashboard,
  Users,
  Building,
  CreditCard,
  FileText,
  ArrowRightLeft,
  MessageSquare,
  User,
  Menu,
  Home,
  UserCheck,
  Building2,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Tenants",
    href: "/tenants",
    icon: Users,
    badge: null,
  },
  // Add this new item for Users management
  {
    name: "Users",
    href: "/users",
    icon: Users, // Reuse Users icon, or import and use a different one like UserCog if preferred
    badge: null, // Optional: Add a badge if you want to show counts/notifications
  },
  {
    name: "Properties",
    href: "/properties",
    icon: Building,
    badge: null,
  },
  {
    name: "Landlords",
    href: "/landlords",
    icon: UserCheck,
    badge: null,
  },
  {
    name: "Units",
    href: "/units",
    icon: Building2,
    badge: 2,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
    badge: 5,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    badge: null,
  },
  // Commented out temporarily to hide the Move In/Out tab
  // {
  //   name: "Move In/Out",
  //   href: "/move",
  //   icon: ArrowRightLeft,
  //   badge: 3,
  // },
  {
    name: "SMS",
    href: "/sms",
    icon: MessageSquare,
    badge: 12,
  },
]

const secondaryNavigation = [
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Help",
    href: "/help",
    icon: HelpCircle,
  },
]

function SidebarContent() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/signin')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background border-r shadow-theme-lg overflow-hidden">
      {/* Logo - Fixed at top */}
      <div className="flex h-16 items-center border-b px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Home className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
            InfiniaSYNC
          </span>
        </div>
      </div>

      {/* Entity Selector - Mobile - Fixed */}
      <div className="p-4 border-b md:hidden flex-shrink-0">
        <EntitySelector />
      </div>

      {/* Navigation Content - Scrollable only if needed */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Main Navigation */}
        <div className="space-y-2 py-4">
          <div className="px-2 py-2">
            <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">
              Main Menu
            </h2>
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent",
                      isActive
                        ? "bg-brand-500 text-white shadow-theme hover:bg-brand-600"
                        : "text-muted-foreground hover:text-accent-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </div>
                    {item.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "default"}
                        className={cn(
                          "h-5 px-1.5 text-xs",
                          isActive ? "bg-white/20 text-white" : "bg-brand-500 text-white",
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Secondary Navigation */}
          <div className="px-2 py-2">
            <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight text-muted-foreground uppercase">Account</h2>
            <div className="space-y-1">
              {secondaryNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent",
                      isActive
                        ? "bg-brand-500 text-white shadow-theme hover:bg-brand-600"
                        : "text-muted-foreground hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="border-t p-4 flex-shrink-0">
        <div className="flex flex-col gap-4">
          {/* Commented out temporarily to hide Current Context */}
          {/* <div className="entity-badge">
            <span className="text-xs">Current Context</span>
            <span className="badge-count">3</span>
          </div> */}
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-muted-foreground hover:text-accent-foreground"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function EnhancedSidebar() {
  return (
    <div className="fixed left-0 top-0 bottom-0 z-30 hidden border-r bg-background md:block w-64">
      <SidebarContent />
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="fixed left-0 top-0 bottom-0 z-30 hidden md:block w-64 bg-background">
      <SidebarContent />
    </div>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-background shadow-theme">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0 w-64">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}
