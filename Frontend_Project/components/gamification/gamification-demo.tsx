'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XPProgressBar } from './xp-progress-bar'
import { RewardPopupModal, type Reward } from './reward-popup-modal'
import { BadgeList } from './badge-list'
import { StreakCounter } from './streak-counter'
import { calculateReward } from '@/lib/utils/rewards'
import { Code2, Gamepad2 } from 'lucide-react'
import type { Badge as BadgeType } from '@/lib/api/types'

/**
 * Demo component showing all gamification features
 * This is for demonstration purposes - integrate these components into your actual pages
 */
export function GamificationDemo() {
  const [reward, setReward] = useState<Reward | null>(null)
  const [isRewardOpen, setIsRewardOpen] = useState(false)

  // Mock user data
  const mockUser = {
    level: 12,
    xp: 2450,
    xpToNextLevel: 3000,
    coins: 150,
    currentStreak: 7,
    longestStreak: 14,
    lastActivityDate: new Date().toISOString(),
  }

  // Mock badges
  const mockBadges: BadgeType[] = [
    {
      id: '1',
      name: 'First Steps',
      description: 'Solve your first problem',
      icon: '🎯',
      rarity: 'common',
      unlockedAt: new Date('2024-01-15').toISOString(),
    },
    {
      id: '2',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      rarity: 'rare',
      unlockedAt: new Date('2024-02-01').toISOString(),
    },
    {
      id: '3',
      name: 'Problem Solver',
      description: 'Solve 50 problems',
      icon: '💪',
      rarity: 'epic',
      unlockedAt: undefined,
    },
    {
      id: '4',
      name: 'Legendary Coder',
      description: 'Reach level 20',
      icon: '👑',
      rarity: 'legendary',
      unlockedAt: undefined,
    },
  ]

  const handleActivityComplete = (activityType: 'easy_problem' | 'medium_problem' | 'mini_game') => {
    const rewards = calculateReward(activityType, { streakBonus: true })
    // Show first reward (you can chain multiple rewards)
    if (rewards.length > 0) {
      setReward(rewards[0])
      setIsRewardOpen(true)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Gamification System Demo</h1>
        <p className="text-muted-foreground">
          Interactive demo of all gamification components
        </p>
      </div>

      {/* XP Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>XP Progress Bar</CardTitle>
          <CardDescription>Shows user level and XP progress</CardDescription>
        </CardHeader>
        <CardContent>
          <XPProgressBar
            level={mockUser.level}
            xp={mockUser.xp}
            xpToNextLevel={mockUser.xpToNextLevel}
          />
        </CardContent>
      </Card>

      {/* Streak Counter */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StreakCounter
          currentStreak={mockUser.currentStreak}
          longestStreak={mockUser.longestStreak}
          lastActivityDate={mockUser.lastActivityDate}
        />

        {/* Coins Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>💰</span>
              <span>Coins</span>
            </CardTitle>
            <CardDescription>Your currency balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl font-bold text-coin">
                  {mockUser.coins}
                </span>
                <span className="text-sm text-muted-foreground">Coins</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badge List */}
      <BadgeList
        badges={mockBadges}
        title="Your Badges"
        description="Achievements and accomplishments"
      />

      {/* Test Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Test Rewards</CardTitle>
          <CardDescription>
            Click buttons to see reward popups (example rewards)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleActivityComplete('easy_problem')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Code2 className="size-4" />
              Complete Easy Problem (+10 XP)
            </Button>
            <Button
              onClick={() => handleActivityComplete('medium_problem')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Code2 className="size-4" />
              Complete Medium Problem (+25 XP)
            </Button>
            <Button
              onClick={() => handleActivityComplete('mini_game')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Gamepad2 className="size-4" />
              Complete Mini Game (+5 XP)
            </Button>
            <Button
              onClick={() => {
                setReward({
                  type: 'badge',
                  badge: mockBadges[0],
                  message: 'Congratulations on your first achievement!',
                  source: 'Achievement unlocked',
                })
                setIsRewardOpen(true)
              }}
              variant="outline"
            >
              Unlock Badge
            </Button>
            <Button
              onClick={() => {
                setReward({
                  type: 'level_up',
                  amount: 13,
                  message: 'You leveled up! Keep learning!',
                  source: 'Level progression',
                })
                setIsRewardOpen(true)
              }}
              variant="outline"
            >
              Level Up
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reward Popup Modal */}
      <RewardPopupModal
        reward={reward}
        open={isRewardOpen}
        onOpenChange={setIsRewardOpen}
      />
    </div>
  )
}
