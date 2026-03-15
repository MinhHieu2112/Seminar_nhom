'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { 
  Play, 
  Send, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  Lightbulb,
  BookOpen,
  Terminal,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { useProblem } from '@/lib/api/services/problem-service'
import { useSubmitCode, useRunCode } from '@/lib/api/services/submission-service'
import type { Difficulty, SubmissionResult, TestResult } from '@/lib/api/types'

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
]

const LANGUAGE_MAP: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
  rust: 'rust',
}

function getDifficultyColor(difficulty: Difficulty) {
  switch (difficulty) {
    case 'easy':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    case 'medium':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    case 'hard':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    default:
      return ''
  }
}

function ProblemDetailSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center gap-4 border-b p-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="flex flex-1">
        <div className="flex w-1/2 flex-col gap-4 border-r p-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="w-1/2 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  )
}

interface TestResultsProps {
  results: TestResult[]
  isRunning: boolean
}

function TestResults({ results, isRunning }: TestResultsProps) {
  if (isRunning) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="mr-2 size-5 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Running tests...</span>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Terminal className="mb-2 size-8" />
        <p>Run your code to see test results</p>
      </div>
    )
  }

  const passedCount = results.filter(r => r.passed).length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Test Results:</span>
        <span className={passedCount === results.length ? 'text-emerald-600' : 'text-amber-600'}>
          {passedCount}/{results.length} passed
        </span>
      </div>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div
            key={result.testCaseId}
            className={`rounded-lg border p-3 ${
              result.passed 
                ? 'border-emerald-500/20 bg-emerald-500/5' 
                : 'border-red-500/20 bg-red-500/5'
            }`}
          >
            <div className="flex items-center gap-2">
              {result.passed ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : (
                <XCircle className="size-4 text-red-600" />
              )}
              <span className="text-sm font-medium">Test Case {index + 1}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {result.runtime}ms
              </span>
            </div>
            {!result.passed && (
              <div className="mt-2 space-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Input: </span>
                  <code className="rounded bg-muted px-1">{result.input}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected: </span>
                  <code className="rounded bg-muted px-1">{result.expectedOutput}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Got: </span>
                  <code className="rounded bg-muted px-1">{result.actualOutput || 'null'}</code>
                </div>
                {result.error && (
                  <div className="text-red-600">
                    <span>Error: </span>
                    <code>{result.error}</code>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface SubmissionSuccessProps {
  result: SubmissionResult
  onClose: () => void
}

function SubmissionSuccess({ result, onClose }: SubmissionSuccessProps) {
  const isAccepted = result.status === 'accepted'

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className={`rounded-full p-4 ${isAccepted ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
        {isAccepted ? (
          <CheckCircle2 className="size-12 text-emerald-600" />
        ) : (
          <XCircle className="size-12 text-red-600" />
        )}
      </div>
      <div className="text-center">
        <h3 className="text-xl font-semibold">
          {isAccepted ? 'Accepted!' : 'Wrong Answer'}
        </h3>
        <p className="mt-1 text-muted-foreground">
          {result.testResults.filter(r => r.passed).length}/{result.testResults.length} test cases passed
        </p>
      </div>
      {isAccepted && result.xpEarned > 0 && (
        <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-amber-600">
          <Zap className="size-4" />
          <span className="font-medium">+{result.xpEarned} XP earned!</span>
        </div>
      )}
      {result.runtime && result.memory && (
        <div className="flex gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-4" />
            <span>{result.runtime}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{result.memory} MB</span>
          </div>
        </div>
      )}
      <Button onClick={onClose} variant="outline" className="mt-2">
        Continue Coding
      </Button>
    </div>
  )
}

export default function ProblemDetailPage({ 
  params 
}: { 
  params: Promise<{ problemId: string }> 
}) {
  const { problemId } = use(params)
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  
  const { data: response, isLoading, error } = useProblem(problemId)
  const submitMutation = useSubmitCode()
  const runMutation = useRunCode()
  
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [activeTab, setActiveTab] = useState('description')
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const problem = response?.data

  // Initialize code with starter code when problem loads
  const handleEditorMount = () => {
    if (problem?.starterCode?.[language]) {
      setCode(problem.starterCode[language])
    }
  }

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    if (problem?.starterCode?.[newLanguage]) {
      setCode(problem.starterCode[newLanguage])
    }
  }

  const handleRunCode = async () => {
    if (!problem) return
    
    setTestResults([])
    try {
      const result = await runMutation.mutateAsync({
        problemId: problem.id,
        code,
        language,
      })
      setTestResults(result.data.testResults)
      setActiveTab('results')
    } catch {
      // Error handled by mutation
    }
  }

  const handleSubmit = async () => {
    if (!problem) return
    
    try {
      const result = await submitMutation.mutateAsync({
        problemId: problem.id,
        code,
        language,
      })
      setSubmissionResult(result.data)
      setShowSuccess(true)
    } catch {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return <ProblemDetailSkeleton />
  }

  if (error || !problem) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Empty
          icon={<BookOpen className="size-12" />}
          title="Problem not found"
          description="The problem you're looking for doesn't exist or has been removed."
        >
          <Button onClick={() => router.push('/problems')}>
            <ChevronLeft className="mr-2 size-4" />
            Back to Problems
          </Button>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b bg-card px-4 py-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/problems')}
        >
          <ChevronLeft className="mr-1 size-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">{problem.title}</h1>
          <Badge 
            variant="outline" 
            className={getDifficultyColor(problem.difficulty)}
          >
            {problem.difficulty}
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="size-4 text-amber-500" />
          <span>{problem.xpReward} XP</span>
        </div>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Problem Description Panel */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <div className="h-full overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-4 mt-4 w-fit">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="flex-1 overflow-auto px-4 pb-4">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Description</h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{problem.description}</p>
                    </div>
                  </div>

                  {/* Examples */}
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Examples</h2>
                    <div className="space-y-4">
                      {problem.examples.map((example, index) => (
                        <Card key={index} className="bg-muted/30">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">
                              Example {index + 1}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Input: </span>
                              <code className="rounded bg-muted px-2 py-0.5">
                                {example.input}
                              </code>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Output: </span>
                              <code className="rounded bg-muted px-2 py-0.5">
                                {example.output}
                              </code>
                            </div>
                            {example.explanation && (
                              <div className="mt-2 text-muted-foreground">
                                <span className="font-medium">Explanation: </span>
                                {example.explanation}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Constraints */}
                  <div>
                    <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Constraints</h2>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      {problem.constraints.map((constraint, index) => (
                        <li key={index}>
                          <code className="text-xs">{constraint}</code>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hints */}
                  {problem.hints.length > 0 && (
                    <div>
                      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Lightbulb className="size-4" />
                        Hints
                      </h2>
                      <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                        {problem.hints.map((hint, index) => (
                          <li key={index}>{hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Topics */}
                  <div>
                    <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Topics</h2>
                    <div className="flex flex-wrap gap-2">
                      {problem.topics.map((topic) => (
                        <Badge key={topic} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="results" className="flex-1 overflow-auto px-4 pb-4">
                {showSuccess && submissionResult ? (
                  <SubmissionSuccess 
                    result={submissionResult} 
                    onClose={() => setShowSuccess(false)} 
                  />
                ) : (
                  <TestResults 
                    results={testResults} 
                    isRunning={runMutation.isPending} 
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Code Editor Panel */}
        <ResizablePanel defaultSize={55} minSize={30}>
          <div className="flex h-full flex-col">
            {/* Editor Toolbar */}
            <div className="flex items-center gap-3 border-b bg-card px-4 py-2">
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunCode}
                  disabled={runMutation.isPending || !code.trim()}
                >
                  {runMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 size-4" />
                  )}
                  Run
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || !code.trim()}
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 size-4" />
                  )}
                  Submit
                </Button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={LANGUAGE_MAP[language] || 'javascript'}
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorMount}
                theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  fontSize: 14,
                  fontFamily: 'var(--font-mono), monospace',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  lineNumbers: 'on',
                  renderLineHighlight: 'line',
                  tabSize: 2,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
