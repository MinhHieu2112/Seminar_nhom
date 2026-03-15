'use client'

import { Award, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Badge as BadgeType } from '@/lib/api/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface BadgeListProps {
  badges: BadgeType[]
  className?: string
  showUnlockedOnly?: boolean
  title?: string
  description?: string
}

const rarityColors = {
  common: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    icon: 'text-gray-500 dark:text-gray-400',
  },
  rare: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-500 dark:text-blue-400',
  },
  epic: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-300 dark:border-purple-700',
    text: 'text-purple-700 dark:text-purple-300',
    icon: 'text-purple-500 dark:text-purple-400',
  },
  legendary: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-300 dark:border-yellow-700',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: 'text-yellow-500 dark:text-yellow-400',
  },
}

export function BadgeList({
  badges,
  className,
  showUnlockedOnly = false,
  title = 'Badges',
  description = 'Your achievements and accomplishments',
}: BadgeListProps) {
  const displayedBadges = showUnlockedOnly
    ? badges.filter((badge) => badge.unlockedAt)
    : badges

  const unlockedCount = badges.filter((badge) => badge.unlockedAt).length

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className="size-5 text-level" />
            {title}
          </span>
          {!showUnlockedOnly && (
            <span className="text-sm font-normal text-muted-foreground">
              {unlockedCount} / {badges.length}
            </span>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {displayedBadges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Award className="mb-2 size-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {showUnlockedOnly
                ? "You haven't unlocked any badges yet"
                : 'No badges available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {displayedBadges.map((badge) => {
              const isUnlocked = !!badge.unlockedAt
              const colors = rarityColors[badge.rarity]

              return (
                <Tooltip key={badge.id}>
                  <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'group relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                          isUnlocked
                            ? cn(
                                colors.bg,
                                colors.border,
                                'cursor-pointer hover:scale-105 hover:shadow-md'
                              )
                            : 'border-muted bg-muted/50 opacity-60 grayscale',
                          'aspect-square'
                        )}
                      >
                        {!isUnlocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock className="size-6 text-muted-foreground" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'flex size-12 items-center justify-center rounded-full',
                            isUnlocked ? colors.bg : 'bg-muted'
                          )}
                        >
                          <Award
                            className={cn(
                              'size-6',
                              isUnlocked ? colors.icon : 'text-muted-foreground'
                            )}
                          />
                        </div>
                        <div className="flex flex-col items-center gap-1 text-center">
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              isUnlocked ? colors.text : 'text-muted-foreground'
                            )}
                          >
                            {badge.name}
                          </span>
                          {isUnlocked && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'h-4 px-1.5 text-[10px]',
                                badge.rarity === 'legendary' &&
                                  'border-yellow-500 text-yellow-600 dark:text-yellow-400',
                                badge.rarity === 'epic' &&
                                  'border-purple-500 text-purple-600 dark:text-purple-400',
                                badge.rarity === 'rare' &&
                                  'border-blue-500 text-blue-600 dark:text-blue-400',
                                badge.rarity === 'common' &&
                                  'border-gray-500 text-gray-600 dark:text-gray-400'
                              )}
                            >
                              {badge.rarity}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {badge.description}
                        </p>
                        {isUnlocked && badge.unlockedAt && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Unlocked{' '}
                            {new Date(badge.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                        {!isUnlocked && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Locked
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
