import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>About This Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-gray-700 text-base">
              <p>
                This platform is a real-time multiplayer coding arena designed for competitive programming and collaborative learning. The goal was to create a simple, robust, and engaging environment where users can join or create rooms, solve coding challenges, and see live results and leaderboards.
              </p>
              <p>
                Key features include:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Real-time multiplayer rooms with public and private options</li>
                <li>Automatic generation of unique coding problems for each game</li>
                <li>Live code evaluation and instant feedback on submissions</li>
                <li>Simple, fair points system and live leaderboard</li>
                <li>Responsive, distraction-free user interface</li>
                <li>Game timer and automatic game completion</li>
              </ul>
              <p>
                <b>Tech stack:</b> Next.js 15, React 19, Prisma, PostgreSQL, Clerk for authentication, Tailwind CSS, Socket.IO for real-time communication, and OpenAI/Gemini for problem generation.
              </p>
              <p>
                This project was built to demonstrate full-stack engineering skills, real-time systems, and a focus on user experience. It is open source and ready for further extension or deployment.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
} 