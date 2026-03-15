import { Metadata } from "next"
import { Trophy, Flame, Target, Calendar, Award } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Profile",
  description: "View your profile and achievements",
}

// Mock data for demonstration
const user = {
  name: "Alex Chen",
  username: "@alexchen",
  avatar: "",
  level: 12,
  xp: 2450,
  xpToNextLevel: 3000,
  streak: 7,
  longestStreak: 14,
  problemsSolved: 47,
  joinedDate: "January 2024",
}

const achievements = [
  { id: 1, title: "First Steps", description: "Solve your first problem", unlocked: true, icon: Trophy },
  { id: 2, title: "Week Warrior", description: "Maintain a 7-day streak", unlocked: true, icon: Flame },
  { id: 3, title: "Problem Solver", description: "Solve 50 problems", unlocked: false, progress: 47, total: 50, icon: Target },
  { id: 4, title: "Consistent Coder", description: "Maintain a 30-day streak", unlocked: false, progress: 7, total: 30, icon: Calendar },
]

const skills = [
  { name: "Arrays", level: 80 },
  { name: "Strings", level: 65 },
  { name: "Trees", level: 45 },
  { name: "Dynamic Programming", level: 30 },
  { name: "Graphs", level: 25 },
]

export default function ProfilePage() {
  const xpProgress = (user.xp / user.xpToNextLevel) * 100

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
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.username}</p>
              
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
                  <span className="mt-1 text-lg font-bold">{user.problemsSolved}</span>
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

              <p className="mt-4 text-xs text-muted-foreground">
                Member since {user.joinedDate}
              </p>
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
                {achievements.map((achievement) => {
                  const AchievementIcon = achievement.icon
                  return (
                    <div
                      key={achievement.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${
                        achievement.unlocked ? "bg-success/5 border-success/20" : "opacity-60"
                      }`}
                    >
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                        achievement.unlocked ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      }`}>
                        <AchievementIcon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{achievement.title}</p>
                          {achievement.unlocked && (
                            <Badge variant="secondary" className="bg-success/10 text-success text-xs">
                              Unlocked
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        {!achievement.unlocked && achievement.progress !== undefined && (
                          <div className="mt-2">
                            <Progress value={(achievement.progress / achievement.total!) * 100} className="h-1" />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {achievement.progress} / {achievement.total}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
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
                  <div key={skill.name}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-muted-foreground">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="mt-1.5 h-2" />
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
