import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-5xl font-bold text-gray-900 mb-4">Leaderboard Not Found</h1>
      <p className="text-lg text-gray-600 mb-8">Sorry, the leaderboard you are looking for does not exist.</p>
      <Link href="/leaderboard">
        <Button>Go to Leaderboard</Button>
      </Link>
    </div>
  )
} 