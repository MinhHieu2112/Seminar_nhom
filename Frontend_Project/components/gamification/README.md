# Gamification Components

A complete gamification system UI with XP, coins, badges, and daily streaks.

## Components

### 1. XP Progress Bar (`XPProgressBar`)

Displays user level and XP progress with a visual progress bar.

```tsx
import { XPProgressBar } from '@/components/gamification'

<XPProgressBar
  level={12}
  xp={2450}
  xpToNextLevel={3000}
  showLevel={true}
  compact={false}
/>
```

**Props:**
- `level: number` - Current user level
- `xp: number` - Current XP points
- `xpToNextLevel: number` - XP needed to reach next level
- `showLevel?: boolean` - Show level badge (default: true)
- `compact?: boolean` - Compact mode (default: false)
- `className?: string` - Additional CSS classes

### 2. Reward Popup Modal (`RewardPopupModal`)

Animated modal that displays when users earn rewards (XP, coins, badges, streaks, level ups).

```tsx
import { RewardPopupModal, type Reward } from '@/components/gamification'

const [reward, setReward] = useState<Reward | null>(null)
const [isOpen, setIsOpen] = useState(false)

// Show reward after completing an activity
setReward({
  type: 'xp',
  amount: 25,
  message: 'Great job!',
  source: 'Medium problem',
})
setIsOpen(true)

<RewardPopupModal
  reward={reward}
  open={isOpen}
  onOpenChange={setIsOpen}
/>
```

**Reward Types:**
- `xp` - XP rewards
- `coins` - Coin rewards
- `badge` - Badge unlocks
- `streak` - Streak milestones
- `level_up` - Level up notifications

### 3. Badge List (`BadgeList`)

Displays a grid of user badges with rarity colors and unlock status.

```tsx
import { BadgeList } from '@/components/gamification'
import type { Badge } from '@/lib/api/types'

const badges: Badge[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Solve your first problem',
    icon: '🎯',
    rarity: 'common',
    unlockedAt: new Date().toISOString(),
  },
  // ...
]

<BadgeList
  badges={badges}
  showUnlockedOnly={false}
  title="Your Badges"
  description="Achievements and accomplishments"
/>
```

**Props:**
- `badges: Badge[]` - Array of badge objects
- `showUnlockedOnly?: boolean` - Only show unlocked badges (default: false)
- `title?: string` - Card title (default: "Badges")
- `description?: string` - Card description
- `className?: string` - Additional CSS classes

**Badge Rarities:**
- `common` - Gray
- `rare` - Blue
- `epic` - Purple
- `legendary` - Gold/Yellow

### 4. Streak Counter (`StreakCounter`)

Displays daily streak information with milestone tracking.

```tsx
import { StreakCounter } from '@/components/gamification'

<StreakCounter
  currentStreak={7}
  longestStreak={14}
  lastActivityDate={new Date().toISOString()}
  compact={false}
/>
```

**Props:**
- `currentStreak: number` - Current active streak
- `longestStreak: number` - Longest streak achieved
- `lastActivityDate?: string` - ISO date string of last activity
- `compact?: boolean` - Compact mode (default: false)
- `className?: string` - Additional CSS classes

## Reward Utilities

Use the reward calculation utility to get rewards for activities:

```tsx
import { calculateReward } from '@/lib/utils/rewards'

// After completing an easy problem
const rewards = calculateReward('easy_problem', {
  bonusMultiplier: 1.5, // Optional bonus
  streakBonus: true,     // Add streak bonus
})

// rewards = [
//   { type: 'xp', amount: 15, message: '...', source: 'Easy problem' },
//   { type: 'coins', amount: 7, message: '...', source: 'Easy problem' },
//   { type: 'streak', amount: 1, message: '...', source: 'Daily activity' }
// ]
```

**Activity Types:**
- `easy_problem` - +10 XP, +5 coins
- `medium_problem` - +25 XP, +10 coins
- `hard_problem` - +50 XP, +20 coins
- `mini_game` - +5 XP, +3 coins

## Example Integration

```tsx
'use client'

import { useState } from 'react'
import { XPProgressBar } from '@/components/gamification/xp-progress-bar'
import { RewardPopupModal, type Reward } from '@/components/gamification/reward-popup-modal'
import { StreakCounter } from '@/components/gamification/streak-counter'
import { BadgeList } from '@/components/gamification/badge-list'
import { calculateReward } from '@/lib/utils/rewards'
import { useCurrentUser } from '@/lib/api/services/user-service'
import { useBadges } from '@/lib/api/services/reward-service'

export function MyGamificationDashboard() {
  const { data: user } = useCurrentUser()
  const { data: badges } = useBadges()
  const [reward, setReward] = useState<Reward | null>(null)
  const [isRewardOpen, setIsRewardOpen] = useState(false)

  const handleProblemSolved = (difficulty: 'easy' | 'medium' | 'hard') => {
    const activityType = `${difficulty}_problem` as const
    const rewards = calculateReward(activityType, { streakBonus: true })
    
    if (rewards.length > 0) {
      setReward(rewards[0])
      setIsRewardOpen(true)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <XPProgressBar
        level={user.level}
        xp={user.xp}
        xpToNextLevel={user.xpToNextLevel}
      />
      
      <StreakCounter
        currentStreak={user.streak}
        longestStreak={user.longestStreak}
        lastActivityDate={user.lastActiveAt}
      />
      
      {badges && (
        <BadgeList
          badges={badges.data}
          title="Your Achievements"
        />
      )}
      
      <RewardPopupModal
        reward={reward}
        open={isRewardOpen}
        onOpenChange={setIsRewardOpen}
      />
    </div>
  )
}
```

## Styling

All components use the design system colors defined in `globals.css`:
- `--xp` / `text-xp` - XP color (orange)
- `--streak` / `text-streak` - Streak color (red/orange)
- `--level` / `text-level` - Level color (purple)
- `--coin` / `text-coin` - Coin color (yellow/gold)

Components are fully responsive and support dark mode.
