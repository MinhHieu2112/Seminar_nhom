"use client"

import { useCurrentUser, useUserStats } from "@/lib/api/services"
import { Trophy, Flame, Target, Award } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const { data: userResponse, isLoading: userLoading, error: userError } = useCurrentUser()
  const user = userResponse?.data
  const { data: statsResponse, isLoading: statsLoading, error: statsError } = useUserStats(user?.id ?? "")
  const stats = statsResponse?.data

  if (userLoading || statsLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-muted-foreground">Loading profile…</div>
    )
  }

  if (userError || !user) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center text-center">
        <p className="text-red-500">Không thể tải thông tin người dùng.</p>
        <p className="text-muted-foreground">Vui lòng đăng nhập lại hoặc thử lại sau.</p>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center text-center">
        <p className="text-red-500">Không thể tải thông tin thống kê.</p>
        <p className="text-muted-foreground">Vui lòng thử lại.</p>
      </div>
    )
  }

  const xpProgress = user.xpToNextLevel > 0 ? (user.xp / user.xpToNextLevel) * 100 : 0
  const achievements = (user.badges || []).slice(0, 4)
  const skills = (user.skills || []).slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          View your stats, achievements, and progress.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="size-24">
                {user.avatar ? <AvatarImage src={user.avatar} alt={user.username} /> : <AvatarFallback className="text-2xl bg-primary/10 text-primary">{(user.username || "U").slice(0, 2).toUpperCase()}</AvatarFallback>}
              </Avatar>
              <h2 className="mt-4 text-xl font-bold">{user.username}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              
              <div className="mt-4 flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-level/20 text-level">
                    <Trophy className="size-5" />
                  </div>
                  <span className="mt-1 text-lg font-bold">{user.level}</span>
                  <span className="text-xs text-muted-foreground">Level</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-streak/20 text-streak">
                    <Flame className="size-5" />
                  </div>
                  <span className="mt-1 text-lg font-bold">{user.streak}</span>
                  <span className="text-xs text-muted-foreground">Day Streak</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Target className="size-5" />
                  </div>
                  <span className="mt-1 text-lg font-bold">{user.totalSolved}</span>
                  <span className="text-xs text-muted-foreground">Solved</span>
                </div>
              </div>

              <div className="mt-6 w-full">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">XP Progress</span>
                  <span className="font-medium">{user.xp} / {user.xpToNextLevel}</span>
                </div>
                <Progress value={xpProgress} className="mt-2 h-2" />
              </div>

              <p className="mt-4 text-xs text-muted-foreground">Member since {new Date(user.joinedAt).toLocaleDateString()}</p>
              {stats && <p className="text-xs text-muted-foreground">Total XP earned: {stats.totalXpEarned.toLocaleString()}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-5 text-xp" />
                Achievements
              </CardTitle>
              <CardDescription>Your unlocked badges and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {achievements.map((badge) => (
                  <div key={badge.id} className="flex items-start gap-3 rounded-lg border p-3 bg-success/5 border-success/20">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/20 text-success"><Award className="size-5"/></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{badge.name}</p>
                        <Badge variant="secondary" className="bg-success/10 text-success text-xs">Unlocked</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Your proficiency in different topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {skills.map((skill) => (
                  <div key={skill.topic}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{skill.topic}</span>
                      <span className="text-muted-foreground">{skill.proficiency}%</span>
                    </div>
                    <Progress value={skill.proficiency} className="mt-1.5 h-2" />
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
