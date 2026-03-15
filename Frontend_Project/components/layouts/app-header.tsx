"use client"

import { usePathname } from "next/navigation"
import { Bell, Search, Moon, Sun, Flame, Zap } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    title: "New Achievement!",
    description: "You've completed your first challenge",
    time: "2m ago",
    read: false,
  },
  {
    id: 2,
    title: "Streak milestone",
    description: "You're on a 7-day streak!",
    time: "1h ago",
    read: false,
  },
  {
    id: 3,
    title: "New problem available",
    description: "Check out the latest coding challenge",
    time: "2h ago",
    read: true,
  },
]

// Map paths to readable titles
const pathTitles: Record<string, string> = {
  dashboard: "Dashboard",
  problems: "Problems",
  submissions: "Submissions",
  "learning-path": "Learning Path",
  "mini-games": "Mini Games",
  profile: "Profile",
  settings: "Settings",
}

function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="size-9"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

function NotificationBell() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-9">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary hover:bg-transparent">
            Mark all read
          </Button>
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {mockNotifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "flex flex-col items-start gap-1 p-3",
                !notification.read && "bg-muted/50"
              )}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="text-sm font-medium">{notification.title}</span>
                {!notification.read && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {notification.description}
              </span>
              <span className="text-xs text-muted-foreground/70">
                {notification.time}
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function QuickStats() {
  return (
    <div className="hidden items-center gap-3 md:flex">
      <Badge
        variant="secondary"
        className="gap-1.5 bg-xp/10 text-xp hover:bg-xp/20"
      >
        <Zap className="size-3" />
        <span className="font-semibold">2,450 XP</span>
      </Badge>
      <Badge
        variant="secondary"
        className="gap-1.5 bg-streak/10 text-streak hover:bg-streak/20"
      >
        <Flame className="size-3" />
        <span className="font-semibold">7 day streak</span>
      </Badge>
    </div>
  )
}

export function AppHeader() {
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter(Boolean)

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.map((segment, index) => {
              const isLast = index === pathSegments.length - 1
              const href = `/${pathSegments.slice(0, index + 1).join("/")}`
              const title = pathTitles[segment] || segment

              return (
                <span key={segment} className="contents">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>{title}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </span>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="ml-auto flex items-center gap-2">
          <QuickStats />
          
          <Button variant="ghost" size="icon" className="size-9">
            <Search className="size-4" />
            <span className="sr-only">Search</span>
          </Button>
          
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
