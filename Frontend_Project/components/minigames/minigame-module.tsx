'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DebugChallenge } from './debug-challenge'
import { OutputPredictionQuiz } from './output-prediction-quiz'
import { CodeOrderingPuzzle } from './code-ordering-puzzle'
import { RewardPopupModal, type Reward } from '@/components/gamification/reward-popup-modal'
import { minigameApi } from '@/lib/api/services/minigame-service'
import { Bug, Code2, ListOrdered } from 'lucide-react'
import type { ApiResponse } from '@/lib/api/types'

export type MinigameType = 'debug' | 'output' | 'ordering'

interface MinigameModuleProps {
  gameType: MinigameType
  onExit?: () => void
}

// Mock data - replace with API calls
const debugBugs = [
  {
    id: '1',
    code: `function calculateSum(arr) {
  let sum = 0;
  for (let i = 0; i <= arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}`,
    description: 'This function has an off-by-one error. Find the bug!',
    lineNumber: 3,
    correctFix: 'i < arr.length',
    points: 20,
  },
  {
    id: '2',
    code: `function findMax(numbers) {
  let max = 0;
  for (let num of numbers) {
    if (num > max) {
      max = num;
    }
  }
  return max;
}`,
    description: 'This function fails with negative numbers. Find the bug!',
    lineNumber: 2,
    correctFix: 'let max = numbers[0]',
    points: 25,
  },
]

const quizQuestions = [
  {
    id: '1',
    code: `let x = 5;
let y = x++;
console.log(x, y);`,
    language: 'JavaScript',
    options: ['5 5', '6 5', '5 6', '6 6'],
    correctAnswer: '6 5',
    explanation: 'x++ returns the value before incrementing, so y = 5, then x becomes 6.',
    points: 15,
  },
  {
    id: '2',
    code: `const arr = [1, 2, 3];
arr.push(4);
console.log(arr.length);`,
    language: 'JavaScript',
    options: ['3', '4', '5', 'undefined'],
    correctAnswer: '4',
    explanation: 'push() adds an element to the array, increasing length to 4.',
    points: 10,
  },
]

const orderingPuzzles = [
  {
    id: '1',
    title: 'Function Call Order',
    description: 'Arrange these lines to create a valid function that calculates factorial',
    blocks: [
      { id: '1', code: 'function factorial(n) {', lineNumber: 1 },
      { id: '2', code: '  if (n <= 1) return 1;', lineNumber: 2 },
      { id: '3', code: '  return n * factorial(n - 1);', lineNumber: 3 },
      { id: '4', code: '}', lineNumber: 4 },
    ],
    points: 30,
  },
  {
    id: '2',
    title: 'Array Processing',
    description: 'Arrange these lines to process an array correctly',
    blocks: [
      { id: '1', code: 'const result = [];', lineNumber: 1 },
      { id: '2', code: 'for (let i = 0; i < arr.length; i++) {', lineNumber: 2 },
      { id: '3', code: '  result.push(arr[i] * 2);', lineNumber: 3 },
      { id: '4', code: '}', lineNumber: 4 },
    ],
    points: 25,
  },
]

export function MinigameModule({ gameType, onExit }: MinigameModuleProps) {
  const [reward, setReward] = useState<Reward | null>(null)
  const [isRewardOpen, setIsRewardOpen] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [gameTime, setGameTime] = useState(0)

  // Fetch rewards when game completes
  // Note: minigameId should be passed as a prop or fetched from context
  // For now, using gameType as a placeholder ID
  const { data: rewardsData } = useQuery({
    queryKey: ['minigames', gameType, 'rewards', gameScore, gameTime],
    queryFn: async () => {
      try {
        return await minigameApi.getMinigameRewards(gameType, gameScore, gameTime)
      } catch (error) {
        // Fallback to default rewards if API fails
        return {
          data: {
            xp: Math.floor(gameScore / 10),
            coins: Math.floor(gameScore / 20),
          },
        } as ApiResponse<{ xp: number; coins: number }>
      }
    },
    enabled: gameScore > 0 && gameTime > 0,
  })

  const getGameTitle = () => {
    switch (gameType) {
      case 'debug':
        return 'Debug Challenge'
      case 'output':
        return 'Output Prediction Quiz'
      case 'ordering':
        return 'Code Ordering Puzzle'
      default:
        return 'Mini Game'
    }
  }

  const gameTitle = getGameTitle()

  const handleGameComplete = (score: number, timeSpent: number) => {
    setGameScore(score)
    setGameTime(timeSpent)
  }

  useEffect(() => {
    if (rewardsData?.data) {
      const { xp, coins } = rewardsData.data
      const rewards: Reward[] = []

      if (xp > 0) {
        rewards.push({
          type: 'xp',
          amount: xp,
          message: `Great job! You earned ${xp} XP!`,
          source: gameTitle,
        })
      }

      if (coins && coins > 0) {
        rewards.push({
          type: 'coins',
          amount: coins,
          message: `You earned ${coins} coins!`,
          source: gameTitle,
        })
      }

      if (rewards.length > 0) {
        setReward(rewards[0])
        setIsRewardOpen(true)
      }
    }
  }, [rewardsData, gameTitle])

  const getGameComponent = () => {
    switch (gameType) {
      case 'debug':
        return (
          <DebugChallenge
            bugs={debugBugs}
            timeLimit={300} // 5 minutes
            onComplete={handleGameComplete}
            onExit={onExit}
          />
        )
      case 'output':
        return (
          <OutputPredictionQuiz
            questions={quizQuestions}
            timeLimit={180} // 3 minutes
            onComplete={handleGameComplete}
            onExit={onExit}
          />
        )
      case 'ordering':
        return (
          <CodeOrderingPuzzle
            puzzles={orderingPuzzles}
            timeLimit={240} // 4 minutes
            onComplete={handleGameComplete}
            onExit={onExit}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {getGameComponent()}
      <RewardPopupModal
        reward={reward}
        open={isRewardOpen}
        onOpenChange={setIsRewardOpen}
      />
    </div>
  )
}
