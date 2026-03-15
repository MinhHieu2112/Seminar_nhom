'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ArrowUp, ArrowDown, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GameBase, type GameState, type GameActions } from './game-base'

interface CodeBlock {
  id: string
  code: string
  lineNumber: number // Correct position
}

interface Puzzle {
  id: string
  title: string
  description: string
  blocks: CodeBlock[]
  points: number
}

interface CodeOrderingPuzzleProps {
  puzzles: Puzzle[]
  timeLimit: number
  onComplete: (score: number, timeSpent: number) => void
  onExit?: () => void
}

export function CodeOrderingPuzzle({
  puzzles,
  timeLimit,
  onComplete,
  onExit,
}: CodeOrderingPuzzleProps) {
  const [blocks, setBlocks] = useState<CodeBlock[]>([])
  const [answeredPuzzles, setAnsweredPuzzles] = useState<Set<string>>(new Set())
  const [correctPuzzles, setCorrectPuzzles] = useState<Set<string>>(new Set())

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    setBlocks((items) => {
      const newItems = [...items]
      if (direction === 'up' && index > 0) {
        ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
      } else if (direction === 'down' && index < items.length - 1) {
        ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
      }
      return newItems
    })
  }

  const checkAnswer = (puzzleId: string, actions: GameActions) => {
    if (answeredPuzzles.has(puzzleId)) return

    const puzzle = puzzles.find((p) => p.id === puzzleId)
    if (!puzzle) return

    const isCorrect = blocks.every(
      (block, index) => block.lineNumber === index + 1
    )

    setAnsweredPuzzles((prev) => new Set(prev).add(puzzleId))

    if (isCorrect) {
      setCorrectPuzzles((prev) => new Set(prev).add(puzzleId))
      actions.updateScore(puzzle.points)
    } else {
      actions.updateScore(Math.floor(puzzle.points * 0.3)) // Partial credit
    }

    // Move to next puzzle after a delay
    setTimeout(() => {
      actions.nextQuestion()
      setBlocks([])
    }, 2000)
  }

  return (
    <GameBase
      title="Code Ordering Puzzle"
      instructions="Drag and drop the code blocks to arrange them in the correct order. Click 'Check Answer' when you're ready."
      timeLimit={timeLimit}
      totalQuestions={puzzles.length}
      onComplete={onComplete}
      onExit={onExit}
    >
      {(gameState: GameState, actions: GameActions) => {
        const currentPuzzle = puzzles[gameState.currentQuestion]
        if (!currentPuzzle) return null

        // Initialize blocks if empty
        if (blocks.length === 0 && currentPuzzle.blocks.length > 0) {
          // Shuffle blocks for the puzzle
          const shuffled = [...currentPuzzle.blocks].sort(() => Math.random() - 0.5)
          setBlocks(shuffled)
        }

        const isAnswered = answeredPuzzles.has(currentPuzzle.id)
        const isCorrect = correctPuzzles.has(currentPuzzle.id)

        const isOrderCorrect = blocks.every(
          (block, index) => block.lineNumber === index + 1
        )

        return (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-6">
                {/* Puzzle Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Puzzle {gameState.currentQuestion + 1} of {puzzles.length}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentPuzzle.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {currentPuzzle.points} points
                  </Badge>
                </div>

                {/* Orderable Blocks */}
                <div className="flex flex-col gap-3">
                  {blocks.map((block, index) => {
                    const correctPosition = block.lineNumber
                    const currentPosition = index + 1
                    const isCorrect = correctPosition === currentPosition

                    return (
                      <div
                        key={block.id}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border bg-card p-4 transition-all',
                          isCorrect && isAnswered && 'border-success bg-success/10',
                          !isAnswered && 'hover:border-primary'
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveBlock(index, 'up')}
                            disabled={isAnswered || index === 0}
                          >
                            <ArrowUp className="size-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveBlock(index, 'down')}
                            disabled={isAnswered || index === blocks.length - 1}
                          >
                            <ArrowDown className="size-3" />
                          </Button>
                        </div>
                        <div className="flex-1 font-mono text-sm">{block.code}</div>
                        {isCorrect && isAnswered && (
                          <CheckCircle2 className="size-5 text-success shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Check Answer Button */}
                {!isAnswered && (
                  <Button
                    onClick={() => checkAnswer(currentPuzzle.id, actions)}
                    className="w-full"
                    size="lg"
                    disabled={blocks.length === 0}
                  >
                    Check Answer
                  </Button>
                )}

                {/* Feedback */}
                {isAnswered && (
                  <div
                    className={cn(
                      'rounded-lg p-4',
                      isCorrect
                        ? 'bg-success/10 border border-success/20'
                        : 'bg-destructive/10 border border-destructive/20'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle2 className="mt-0.5 size-5 text-success shrink-0" />
                      ) : (
                        <XCircle className="mt-0.5 size-5 text-destructive shrink-0" />
                      )}
                      <div className="flex-1">
                        <p
                          className={cn(
                            'font-semibold',
                            isCorrect ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {isCorrect
                            ? `Correct order! +${currentPuzzle.points} points`
                            : `Incorrect order! +${Math.floor(currentPuzzle.points * 0.3)} points`}
                        </p>
                        {!isCorrect && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Try to arrange the code in the correct execution order.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      }}
    </GameBase>
  )
}
