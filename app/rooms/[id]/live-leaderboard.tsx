import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Clock } from "lucide-react"

interface LiveLeaderboardProps {
  gameId: string
}

export async function LiveLeaderboard({ gameId }: LiveLeaderboardProps) {
  const leaderboard = await prisma.leaderboard.findMany({
    where: { gameId },
    select: {
      id: true,
      score: true,
      rank: true,
      submissionTime: true,
      user: { select: { username: true } },
    },
    orderBy: [{ rank: "asc" }, { score: "desc" }, { submissionTime: "asc" }],
    take: 10,
  })

  const submissions = await prisma.submission.findMany({
    where: { gameId },
    select: {
      id: true,
      isCorrect: true,
      language: true,
      submittedAt: true,
      user: { select: { username: true } },
    },
    orderBy: { submittedAt: "desc" },
    take: 10,
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Live Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No correct submissions yet</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      {index === 0 && <Trophy className="h-6 w-6 text-yellow-500" />}
                      {index === 1 && <Medal className="h-6 w-6 text-gray-400" />}
                      {index === 2 && <Award className="h-6 w-6 text-amber-600" />}
                      {index > 2 && <span className="text-lg font-bold text-gray-500">#{index + 1}</span>}
                    </div>
                    <div>
                      <h4 className="font-medium">{entry.user.username}</h4>
                      <p className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(entry.submissionTime!).toLocaleTimeString()}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{entry.score} pts</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {submissions.slice(0, 5).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${submission.isCorrect ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-sm font-medium">{submission.user.username}</span>
                    <Badge variant="outline" className="text-xs">
                      {submission.language}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">{new Date(submission.submittedAt).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
