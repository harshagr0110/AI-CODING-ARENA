"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MainLayout } from "@/components/main-layout"
import { Search, Code, Clock, Play } from "lucide-react"

interface Question {
  id: string
  title: string
  description: string
  difficulty: string
  recommendedTimeComplexity?: string
  questionType: string
  createdAt: string
  creator: {
    username: string
  }
}

export default function PracticePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("")

  useEffect(() => {
    fetchQuestions()
  }, [difficultyFilter])

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams()
      if (difficultyFilter) params.append('difficulty', difficultyFilter)
      params.append('questionType', 'normal') // Only show normal questions for practice
      
      const response = await fetch(`/api/questions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Solo</h1>
            <p className="text-gray-600">Solve coding problems at your own pace</p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search problems..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <Button variant="outline" onClick={() => {
                  setSearchTerm("")
                  setDifficultyFilter("")
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Questions Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading problems...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No problems found</h3>
                <p className="text-gray-500 mb-4">
                  {questions.length === 0 
                    ? "No practice problems are available yet." 
                    : "No problems match your current filters."
                  }
                </p>
                <Link href="/questions/upload">
                  <Button>Add Problems</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">{question.title}</CardTitle>
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">
                      {question.description}
                    </CardDescription>
                    
                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      {question.recommendedTimeComplexity && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Time: {question.recommendedTimeComplexity}</span>
                        </div>
                      )}
                      <div>
                        <span>By {question.creator.username}</span>
                      </div>
                    </div>

                    <Link href={`/practice/${question.id}`} className="block">
                      <Button className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Start Practice
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}