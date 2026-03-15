'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Timer, Trophy, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GameState {
  score: number
  timeRemaining: number
  isPlaying: boolean
  isFinished: boolean
  currentQuestion: number
  totalQuestions: number
}

interface GameBaseProps {
  title: string
  instructions: string
  timeLimit: number // in seconds
  totalQuestions: number
  onComplete: (score: number, timeSpent: number) => void
  onExit?: () => void
  children: (gameState: GameState, actions: GameActions) => React.ReactNode
}

export interface GameActions {
  startGame: () => void
  endGame: () => void
  updateScore: (points: number) => void
  nextQuestion: () => void
}

export function GameBase({
  title,
  instructions,
  timeLimit,
  totalQuestions,
  onComplete,
  onExit,
  children,
}: GameBaseProps) {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeRemaining: timeLimit,
    isPlaying: false,
    isFinished: false,
    currentQuestion: 0,
    totalQuestions,
  })
  const [pendingCompletion, setPendingCompletion] = useState<{
    score: number
    timeSpent: number
  } | null>(null)

  // Handle game completion in effect to avoid setState during render
  useEffect(() => {
    if (pendingCompletion) {
      onComplete(pendingCompletion.score, pendingCompletion.timeSpent)
      setPendingCompletion(null)
    }
  }, [pendingCompletion, onComplete])

  // Timer effect
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isFinished) return

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeRemaining <= 1) {
          // Time's up
          const timeSpent = timeLimit - 0
          setPendingCompletion({ score: prev.score, timeSpent })
          return {
            ...prev,
            timeRemaining: 0,
            isPlaying: false,
            isFinished: true,
          }
        }
        return {
          ...prev,
          timeRemaining: prev.timeRemaining - 1,
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [gameState.isPlaying, gameState.isFinished, timeLimit])

  const startGame = () => {
    setGameState({
      score: 0,
      timeRemaining: timeLimit,
      isPlaying: true,
      isFinished: false,
      currentQuestion: 0,
      totalQuestions,
    })
  }

  const endGame = () => {
    if (gameState.isPlaying) {
      const timeSpent = timeLimit - gameState.timeRemaining
      setPendingCompletion({ score: gameState.score, timeSpent })
    }
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      isFinished: true,
    }))
  }

  const updateScore = (points: number) => {
    setGameState((prev) => ({
      ...prev,
      score: prev.score + points,
    }))
  }

  const nextQuestion = () => {
    setGameState((prev) => {
      const next = prev.currentQuestion + 1
      if (next >= totalQuestions) {
        // All questions completed
        const timeSpent = timeLimit - prev.timeRemaining
        setPendingCompletion({ score: prev.score, timeSpent })
        return {
          ...prev,
          currentQuestion: next,
          isPlaying: false,
          isFinished: true,
        }
      }
      return {
        ...prev,
        currentQuestion: next,
      }
    })
  }

  const actions: GameActions = {
    startGame,
    endGame,
    updateScore,
    nextQuestion,
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const timeProgress = (gameState.timeRemaining / timeLimit) * 100

  return (
    <div className="flex flex-col gap-4">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            {onExit && (
              <Button variant="ghost" size="sm" onClick={onExit}>
                Exit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Instructions */}
            {!gameState.isPlaying && !gameState.isFinished && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{instructions}</p>
                </div>
              </div>
            )}

            {/* Game Stats */}
            <div className="grid grid-cols-3 gap-4">
              {/* Timer */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="size-4" />
                  <span>Time</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span
                    className={cn(
                      'text-2xl font-bold',
                      gameState.timeRemaining < 10 && 'text-destructive animate-pulse'
                    )}
                  >
                    {formatTime(gameState.timeRemaining)}
                  </span>
                </div>
                <Progress
                  value={timeProgress}
                  className={cn(
                    'h-1.5',
                    gameState.timeRemaining < 10 && 'bg-destructive/20'
                  )}
                />
              </div>

              {/* Score */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="size-4" />
                  <span>Score</span>
                </div>
                <span className="text-2xl font-bold text-xp">
                  {gameState.score}
                </span>
              </div>

              {/* Progress */}
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <span className="text-2xl font-bold">
                  {gameState.currentQuestion} / {totalQuestions}
                </span>
                <Progress
                  value={(gameState.currentQuestion / totalQuestions) * 100}
                  className="h-1.5"
                />
              </div>
            </div>

            {/* Start Button */}
            {!gameState.isPlaying && !gameState.isFinished && (
              <Button onClick={startGame} className="w-full" size="lg">
                Start Game
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Game Content */}
      {gameState.isPlaying && (
        <div className="min-h-[400px]">
          {children(gameState, actions)}
        </div>
      )}

      {/* Finished State */}
      {gameState.isFinished && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <Trophy className="size-12 text-xp" />
              <div>
                <h3 className="text-2xl font-bold">Game Complete!</h3>
                <p className="text-muted-foreground mt-2">
                  Final Score: <span className="font-semibold text-xp">{gameState.score}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
