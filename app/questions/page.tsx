"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MainLayout } from "@/components/main-layout"
import { Plus, Search, Code, Clock } from "lucide-react"

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

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  useEffect(() => {
    fetchQuestions()
  }, [difficultyFilter, typeFilter])

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams()
      if (difficultyFilter) params.append('difficulty', difficultyFilter)
      if (typeFilter) params.append('questionType', typeFilter)
      
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'debugging': return 'bg-purple-100 text-purple-800'
      case 'puzzle': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Bank</h1>
              <p className="text-gray-600">Browse and manage coding questions</p>
            </div>
            <Link href="/questions/upload">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search questions..."
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

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="">All Types</option>
                  <option value="normal">Normal</option>
                  <option value="debugging">Debugging</option>
                  <option value="puzzle">Puzzle</option>
                </select>

                <Button variant="outline" onClick={() => {
                  setSearchTerm("")
                  setDifficultyFilter("")
                  setTypeFilter("")
                }}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Questions Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                <p className="text-gray-500 mb-4">
                  {questions.length === 0 
                    ? "No questions have been created yet." 
                    : "No questions match your current filters."
                  }
                </p>
                <Link href="/questions/upload">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Question
                  </Button>
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
                      <div className="flex flex-col gap-2 ml-2">
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge className={getTypeColor(question.questionType)}>
                          {question.questionType}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">
                      {question.description}
                    </CardDescription>
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      {question.recommendedTimeComplexity && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Time: {question.recommendedTimeComplexity}</span>
                        </div>
                      )}
                      <div>
                        <span>By {question.creator.username}</span>
                      </div>
                      <div>
                        <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Link href={`/practice/${question.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Practice
                        </Button>
                      </Link>
                      <Link href={`/questions/${question.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
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