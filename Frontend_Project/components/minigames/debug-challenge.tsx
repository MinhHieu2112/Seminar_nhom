'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GameBase, type GameState, type GameActions } from './game-base'

interface Bug {
  id: string
  code: string
  description: string
  lineNumber: number
  correctFix: string
  points: number
}

interface DebugChallengeProps {
  bugs: Bug[]
  timeLimit: number
  onComplete: (score: number, timeSpent: number) => void
  onExit?: () => void
}

export function DebugChallenge({
  bugs,
  timeLimit,
  onComplete,
  onExit,
}: DebugChallengeProps) {
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const [fixedBugs, setFixedBugs] = useState<Set<string>>(new Set())
  const [wrongAttempts, setWrongAttempts] = useState<Set<string>>(new Set())

  const handleBugFix = (
    bugId: string,
    lineNumber: number,
    actions: GameActions
  ) => {
    const bug = bugs.find((b) => b.id === bugId)
    if (!bug) return

    if (lineNumber === bug.lineNumber) {
      // Correct fix
      setFixedBugs((prev) => new Set(prev).add(bugId))
      actions.updateScore(bug.points)
      actions.nextQuestion()
      setSelectedLine(null)
    } else {
      // Wrong attempt
      setWrongAttempts((prev) => new Set(prev).add(bugId))
      actions.updateScore(-5) // Penalty for wrong answer
    }
  }

  return (
    <GameBase
      title="Debug Challenge"
      instructions="Find and click on the line number where the bug is located. Each bug has a description to help you identify it."
      timeLimit={timeLimit}
      totalQuestions={bugs.length}
      onComplete={onComplete}
      onExit={onExit}
    >
      {(gameState: GameState, actions: GameActions) => {
        const currentBug = bugs[gameState.currentQuestion]
        if (!currentBug) return null

        const isFixed = fixedBugs.has(currentBug.id)
        const hasWrongAttempt = wrongAttempts.has(currentBug.id)

        // Parse code into lines
        const codeLines = currentBug.code.split('\n')

        return (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-6">
                {/* Bug Description */}
                <div className="rounded-lg border bg-destructive/10 p-4">
                  <div className="flex items-start gap-2">
                    <Code2 className="mt-0.5 size-5 text-destructive" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-destructive">
                        Bug #{gameState.currentQuestion + 1}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {currentBug.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Points: <span className="font-semibold">+{currentBug.points}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Code Display */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="font-mono text-sm">
                    {codeLines.map((line, index) => {
                      const lineNum = index + 1
                      const isSelected = selectedLine === lineNum
                      const isBugLine = lineNum === currentBug.lineNumber
                      const isClickable = !isFixed

                      return (
                        <div
                          key={index}
                          className={cn(
                            'flex items-start gap-3 px-2 py-1 rounded transition-colors',
                            isSelected && 'bg-primary/20',
                            isBugLine && isFixed && 'bg-success/20',
                            isBugLine && hasWrongAttempt && !isFixed && 'bg-destructive/20',
                            isClickable && 'cursor-pointer hover:bg-muted'
                          )}
                          onClick={() => {
                            if (isClickable) {
                              setSelectedLine(lineNum)
                              handleBugFix(currentBug.id, lineNum, actions)
                            }
                          }}
                        >
                          <span className="text-muted-foreground select-none min-w-[3ch] text-right">
                            {lineNum}
                          </span>
                          <span className="flex-1">{line || ' '}</span>
                          {isBugLine && isFixed && (
                            <CheckCircle2 className="size-4 text-success shrink-0" />
                          )}
                          {isBugLine && hasWrongAttempt && !isFixed && (
                            <XCircle className="size-4 text-destructive shrink-0" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Status */}
                {isFixed && (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-success/10 p-4">
                    <CheckCircle2 className="size-5 text-success" />
                    <span className="font-semibold text-success">
                      Bug fixed! +{currentBug.points} points
                    </span>
                  </div>
                )}

                {hasWrongAttempt && !isFixed && (
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 p-4">
                    <XCircle className="size-5 text-destructive" />
                    <span className="font-semibold text-destructive">
                      Wrong line! Try again. (-5 points)
                    </span>
                  </div>
                )}

                {/* Hint */}
                {!isFixed && !hasWrongAttempt && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Click on the line number where you think the bug is located
                    </p>
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
