'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Zap, Coins, Award, Flame, Sparkles, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Badge as BadgeType } from '@/lib/api/types'

export interface Reward {
  type: 'xp' | 'coins' | 'badge' | 'streak' | 'level_up'
  amount?: number
  badge?: BadgeType
  message: string
  source?: string // e.g., "Easy problem", "Medium problem", "Mini game"
}

interface RewardPopupModalProps {
  reward: Reward | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RewardPopupModal({
  reward,
  open,
  onOpenChange,
}: RewardPopupModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (open && reward) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 600)
      return () => clearTimeout(timer)
    }
  }, [open, reward])

  if (!reward) return null

  const getIcon = () => {
    switch (reward.type) {
      case 'xp':
        return <Zap className="size-8 text-xp" />
      case 'coins':
        return <Coins className="size-8 text-coin" />
      case 'badge':
        return <Award className="size-8 text-level" />
      case 'streak':
        return <Flame className="size-8 text-streak" />
      case 'level_up':
        return <Trophy className="size-8 text-level" />
      default:
        return <Sparkles className="size-8 text-primary" />
    }
  }

  const getTitle = () => {
    switch (reward.type) {
      case 'xp':
        return `+${reward.amount} XP Earned!`
      case 'coins':
        return `+${reward.amount} Coins Earned!`
      case 'badge':
        return 'New Badge Unlocked!'
      case 'streak':
        return `${reward.amount} Day Streak!`
      case 'level_up':
        return 'Level Up!'
      default:
        return 'Reward Earned!'
    }
  }

  const getColorClass = () => {
    switch (reward.type) {
      case 'xp':
        return 'bg-xp/10 border-xp/20'
      case 'coins':
        return 'bg-coin/10 border-coin/20'
      case 'badge':
        return 'bg-level/10 border-level/20'
      case 'streak':
        return 'bg-streak/10 border-streak/20'
      case 'level_up':
        return 'bg-level/10 border-level/20'
      default:
        return 'bg-primary/10 border-primary/20'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {getTitle()}
          </DialogTitle>
          {reward.source && (
            <DialogDescription className="text-center">
              {reward.source}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Animated Icon */}
          <div
            className={cn(
              'relative flex size-24 items-center justify-center rounded-full border-2 transition-all duration-500',
              getColorClass(),
              isAnimating && 'scale-110 animate-pulse'
            )}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-50" />
            {getIcon()}
            {isAnimating && (
              <div className="absolute inset-0 animate-ping rounded-full border-2 border-current opacity-20" />
            )}
          </div>

          {/* Reward Details */}
          <div className="flex flex-col items-center gap-2 text-center">
            {reward.type === 'badge' && reward.badge && (
              <div className="flex flex-col items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    'px-4 py-2 text-base',
                    reward.badge.rarity === 'legendary' && 'border-yellow-500 text-yellow-600 dark:text-yellow-400',
                    reward.badge.rarity === 'epic' && 'border-purple-500 text-purple-600 dark:text-purple-400',
                    reward.badge.rarity === 'rare' && 'border-blue-500 text-blue-600 dark:text-blue-400',
                    reward.badge.rarity === 'common' && 'border-gray-500 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {reward.badge.name}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {reward.badge.description}
                </p>
              </div>
            )}

            {(reward.type === 'xp' || reward.type === 'coins') && (
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold">
                  {reward.type === 'xp' ? (
                    <span className="text-xp">+{reward.amount}</span>
                  ) : (
                    <span className="text-coin">+{reward.amount}</span>
                  )}
                </span>
              </div>
            )}

            {reward.type === 'level_up' && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-level">
                  Level {reward.amount}!
                </span>
                <p className="text-sm text-muted-foreground">
                  Keep up the great work!
                </p>
              </div>
            )}

            {reward.type === 'streak' && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-bold text-streak">
                  {reward.amount} Days
                </span>
                <p className="text-sm text-muted-foreground">
                  You're on fire! 🔥
                </p>
              </div>
            )}

            {reward.message && (
              <p className="mt-2 text-sm text-muted-foreground">
                {reward.message}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
