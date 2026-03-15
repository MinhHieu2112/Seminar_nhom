"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Code2,
  FileCheck,
  Route,
  Gamepad2,
  User,
  Settings,
  Trophy,
  Flame,
  Zap,
  ChevronUp,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Problems",
    url: "/problems",
    icon: Code2,
  },
  {
    title: "Submissions",
    url: "/submissions",
    icon: FileCheck,
  },
  {
    title: "Learning Path",
    url: "/learning-path",
    icon: Route,
  },
  {
    title: "Mini Games",
    url: "/mini-games",
    icon: Gamepad2,
  },
]

const accountNavItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

// Mock user data - replace with real data from your auth/state management
const mockUser = {
  name: "Alex Chen",
  email: "alex@example.com",
  avatar: "",
  level: 12,
  xp: 2450,
  xpToNextLevel: 3000,
  streak: 7,
}

function UserStats() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (isCollapsed) {
    return null
  }

  const xpProgress = (mockUser.xp / mockUser.xpToNextLevel) * 100

  return (
    <div className="px-2 py-3">
      <div className="flex items-center justify-between gap-2 rounded-lg bg-sidebar-accent/50 p-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-level/20 text-level">
            <Trophy className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Level</span>
            <span className="text-sm font-semibold">{mockUser.level}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-streak/20 text-streak">
            <Flame className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Streak</span>
            <span className="text-sm font-semibold">{mockUser.streak} days</span>
          </div>
        </div>
      </div>
      <div className="mt-3 px-1">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-xp">
            <Zap className="size-3" />
            XP Progress
          </span>
          <span className="text-muted-foreground">
            {mockUser.xp}/{mockUser.xpToNextLevel}
          </span>
        </div>
        <Progress value={xpProgress} className="mt-1.5 h-2" />
      </div>
    </div>
  )
}

function UserMenu() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
              {mockUser.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{mockUser.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {mockUser.email}
                </span>
              </div>
              <ChevronUp className="ml-auto size-4" />
            </>
          )}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="top"
        align="start"
        sideOffset={4}
      >
        <div className="flex items-center gap-2 p-2">
          <Avatar className="size-10 rounded-lg">
            <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
              {mockUser.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{mockUser.name}</span>
            <span className="text-xs text-muted-foreground">{mockUser.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Code2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">CodeQuest</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Learn to Code
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <UserStats />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
