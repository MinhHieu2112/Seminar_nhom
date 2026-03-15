'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Code2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GameBase, type GameState, type GameActions } from './game-base'

interface QuizQuestion {
  id: string
  code: string
  language: string
  options: string[]
  correctAnswer: string
  explanation?: string
  points: number
}

interface OutputPredictionQuizProps {
  questions: QuizQuestion[]
  timeLimit: number
  onComplete: (score: number, timeSpent: number) => void
  onExit?: () => void
}

export function OutputPredictionQuiz({
  questions,
  timeLimit,
  onComplete,
  onExit,
}: OutputPredictionQuizProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set())
  const [correctAnswers, setCorrectAnswers] = useState<Set<string>>(new Set())

  const handleAnswer = (questionId: string, answer: string, actions: GameActions) => {
    if (answeredQuestions.has(questionId)) return

    const question = questions.find((q) => q.id === questionId)
    if (!question) return

    setSelectedAnswer(answer)
    setAnsweredQuestions((prev) => new Set(prev).add(questionId))

    if (answer === question.correctAnswer) {
      setCorrectAnswers((prev) => new Set(prev).add(questionId))
      actions.updateScore(question.points)
    } else {
      actions.updateScore(Math.floor(question.points * 0.2)) // Partial credit
    }

    // Move to next question after a delay
    setTimeout(() => {
      setSelectedAnswer(null)
      actions.nextQuestion()
    }, 2000)
  }

  return (
    <GameBase
      title="Output Prediction Quiz"
      instructions="Read the code snippet and predict what the output will be. Select the correct answer from the options below."
      timeLimit={timeLimit}
      totalQuestions={questions.length}
      onComplete={onComplete}
      onExit={onExit}
    >
      {(gameState: GameState, actions: GameActions) => {
        const currentQuestion = questions[gameState.currentQuestion]
        if (!currentQuestion) return null

        const isAnswered = answeredQuestions.has(currentQuestion.id)
        const isCorrect = correctAnswers.has(currentQuestion.id)

        return (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-6">
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Question {gameState.currentQuestion + 1} of {questions.length}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      What will this code output?
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {currentQuestion.points} points
                  </Badge>
                </div>

                {/* Code Display */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Code2 className="size-4 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {currentQuestion.language}
                    </Badge>
                  </div>
                  <pre className="overflow-x-auto font-mono text-sm">
                    <code>{currentQuestion.code}</code>
                  </pre>
                </div>

                {/* Answer Options */}
                <div className="grid gap-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswer === option
                    const isCorrectOption = option === currentQuestion.correctAnswer
                    const showResult = isAnswered

                    return (
                      <Button
                        key={index}
                        variant={isSelected ? 'default' : 'outline'}
                        className={cn(
                          'h-auto justify-start p-4 text-left',
                          isSelected && isCorrectOption && showResult && 'bg-success text-success-foreground',
                          isSelected && !isCorrectOption && showResult && 'bg-destructive text-destructive-foreground',
                          !isSelected && isCorrectOption && showResult && 'border-success bg-success/10',
                          isAnswered && 'cursor-not-allowed opacity-75'
                        )}
                        onClick={() => handleAnswer(currentQuestion.id, option, actions)}
                        disabled={isAnswered}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="font-mono text-sm">{option}</span>
                          {showResult && (
                            <>
                              {isSelected && isCorrectOption && (
                                <CheckCircle2 className="size-5 shrink-0" />
                              )}
                              {isSelected && !isCorrectOption && (
                                <XCircle className="size-5 shrink-0" />
                              )}
                              {!isSelected && isCorrectOption && (
                                <CheckCircle2 className="size-5 shrink-0 text-success" />
                              )}
                            </>
                          )}
                        </div>
                      </Button>
                    )
                  })}
                </div>

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
                            ? `Correct! +${currentQuestion.points} points`
                            : `Incorrect! +${Math.floor(currentQuestion.points * 0.2)} points`}
                        </p>
                        {currentQuestion.explanation && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {currentQuestion.explanation}
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
