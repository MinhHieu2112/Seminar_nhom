import type { Reward } from '@/components/gamification/reward-popup-modal'

export type ActivityType = 'easy_problem' | 'medium_problem' | 'hard_problem' | 'mini_game'

export interface RewardConfig {
  xp: number
  coins?: number
  source: string
}

const rewardConfigs: Record<ActivityType, RewardConfig> = {
  easy_problem: {
    xp: 10,
    coins: 5,
    source: 'Easy problem',
  },
  medium_problem: {
    xp: 25,
    coins: 10,
    source: 'Medium problem',
  },
  hard_problem: {
    xp: 50,
    coins: 20,
    source: 'Hard problem',
  },
  mini_game: {
    xp: 5,
    coins: 3,
    source: 'Mini game',
  },
}

/**
 * Calculate rewards for completing an activity
 */
export function calculateReward(
  activityType: ActivityType,
  options?: {
    bonusMultiplier?: number
    streakBonus?: boolean
  }
): Reward[] {
  const config = rewardConfigs[activityType]
  const multiplier = options?.bonusMultiplier || 1
  const xp = Math.floor(config.xp * multiplier)
  const coins = config.coins ? Math.floor(config.coins * multiplier) : undefined

  const rewards: Reward[] = [
    {
      type: 'xp',
      amount: xp,
      message: `You earned ${xp} XP!`,
      source: config.source,
    },
  ]

  if (coins) {
    rewards.push({
      type: 'coins',
      amount: coins,
      message: `You earned ${coins} coins!`,
      source: config.source,
    })
  }

  if (options?.streakBonus) {
    rewards.push({
      type: 'streak',
      amount: 1,
      message: 'Your streak continues!',
      source: 'Daily activity',
    })
  }

  return rewards
}

/**
 * Get reward configuration for an activity type
 */
export function getRewardConfig(activityType: ActivityType): RewardConfig {
  return rewardConfigs[activityType]
}
