import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Code, Users, Trophy, Zap } from "lucide-react"
import Link from "next/link"
import { MainLayout } from "@/components/main-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"

export default function HomePage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="container mx-auto px-4 py-16"><Skeleton className="h-96 w-full mb-8" /><Skeleton className="h-32 w-full mb-8" /><Skeleton className="h-32 w-full mb-8" /></div>}>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Compete. Code. Conquer.</h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Join the ultimate multiplayer coding arena where AI generates challenges and evaluates your solutions in
                real-time competitions.
              </p>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Start Competing
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Enter Arena
                  </Button>
                </Link>
              </SignedIn>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <Zap className="h-8 w-8 text-yellow-500 mb-2" />
                  <CardTitle className="dark:text-white">AI-Powered</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="dark:text-gray-300">
                    Google Gemini generates unique coding challenges and evaluates solutions instantly.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <Users className="h-8 w-8 text-green-500 mb-2" />
                  <CardTitle className="dark:text-white">Real-time Multiplayer</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="dark:text-gray-300">Compete with up to 4 players simultaneously in live coding battles.</CardDescription>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <Trophy className="h-8 w-8 text-purple-500 mb-2" />
                  <CardTitle className="dark:text-white">Smart Scoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="dark:text-gray-300">Win by correctness, time complexity, and submission speed.</CardDescription>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <Code className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle className="dark:text-white">Instant Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="dark:text-gray-300">Get detailed AI feedback on your code quality and efficiency.</CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h3>
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2 dark:text-white">Join a Room</h4>
                  <p className="text-gray-600 dark:text-gray-300">Create or join a coding room with other players</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">2</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2 dark:text-white">Solve Challenges</h4>
                  <p className="text-gray-600 dark:text-gray-300">AI generates unique coding problems for each game</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                  </div>
                  <h4 className="text-xl font-semibold mb-2 dark:text-white">Win & Learn</h4>
                  <p className="text-gray-600 dark:text-gray-300">Get instant AI feedback and climb the leaderboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </MainLayout>
  )
}
