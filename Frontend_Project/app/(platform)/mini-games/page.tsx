'use client'

import { useRouter } from "next/navigation"
import { Bug, Code2, ListOrdered, Trophy } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const games = [
  {
    id: 'debug',
    title: "Debug Challenge",
    description: "Find and fix bugs in broken code",
    icon: Bug,
    players: "Solo",
    bestScore: 950,
    xpReward: 80,
    color: "bg-destructive/10 text-destructive",
    route: "/mini-games/debug",
  },
  {
    id: 'output',
    title: "Output Prediction Quiz",
    description: "Predict what code will output",
    icon: Code2,
    players: "Solo",
    bestScore: 1200,
    xpReward: 100,
    color: "bg-xp/10 text-xp",
    route: "/mini-games/output",
  },
  {
    id: 'ordering',
    title: "Code Ordering Puzzle",
    description: "Arrange code blocks in the correct order",
    icon: ListOrdered,
    players: "Solo",
    bestScore: 850,
    xpReward: 75,
    color: "bg-level/10 text-level",
    route: "/mini-games/ordering",
  },
]

const leaderboard = [
  { rank: 1, name: "CodeMaster42", score: 15420, avatar: "CM" },
  { rank: 2, name: "AlgoNinja", score: 14890, avatar: "AN" },
  { rank: 3, name: "ByteRunner", score: 14200, avatar: "BR" },
  { rank: 4, name: "You", score: 12450, avatar: "AC", isCurrentUser: true },
  { rank: 5, name: "DevWizard", score: 11800, avatar: "DW" },
]

export default function MiniGamesPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mini Games</h1>
        <p className="text-muted-foreground">
          Challenge yourself with fun coding games and compete for high scores.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {games.map((game) => {
              const GameIcon = game.icon
              return (
                <Card key={game.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`flex size-12 items-center justify-center rounded-lg ${game.color}`}>
                        <GameIcon className="size-6" />
                      </div>
                      <Badge variant="outline">{game.players}</Badge>
                    </div>
                    <CardTitle className="mt-3">{game.title}</CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Best Score</span>
                        <span className="font-semibold">{game.bestScore.toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-xs text-muted-foreground">Reward</span>
                        <span className="font-semibold text-xp">+{game.xpReward} XP</span>
                      </div>
                    </div>
                    <Button 
                      className="mt-4 w-full"
                      onClick={() => router.push(game.route)}
                    >
                      Play Now
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-5 text-xp" />
                Leaderboard
              </CardTitle>
              <CardDescription>Top players this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {leaderboard.map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center gap-3 rounded-lg p-2 ${
                      player.isCurrentUser ? "bg-primary/10" : ""
                    }`}
                  >
                    <span className={`flex size-6 items-center justify-center text-sm font-bold ${
                      player.rank === 1 ? "text-xp" : 
                      player.rank === 2 ? "text-muted-foreground" : 
                      player.rank === 3 ? "text-streak" : "text-muted-foreground"
                    }`}>
                      {player.rank}
                    </span>
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {player.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-sm font-medium ${player.isCurrentUser ? "text-primary" : ""}`}>
                        {player.name}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">{player.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
