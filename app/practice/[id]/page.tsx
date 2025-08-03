"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/main-layout"
import { MonacoCodeEditor } from "@/components/monaco-code-editor"
import { Clock, Play, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Question {
  id: string
  title: string
  description: string
  difficulty: string
  recommendedTimeComplexity?: string
  testCases: Array<{
    input: string
    expectedOutput: string
    explanation?: string
  }>
  creator: {
    username: string
  }
}

interface SubmissionResult {
  isCorrect: boolean
  feedback: string
  executionTime: number
  testResults: Array<{
    input: string
    expectedOutput: string
    actualOutput: string
    passed: boolean
  }>
}

interface Props {
  params: Promise<{
    id: string
  }>
}

export default function PracticeQuestionPage({ params }: Props) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState("javascript")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmissionResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/questions/${id}`)
        if (response.ok) {
          const data = await response.json()
          setQuestion(data)
        } else {
          router.push('/practice')
        }
      } catch (error) {
        console.error("Error fetching question:", error)
        router.push('/practice')
      } finally {
        setLoading(false)
      }
    }

    fetchQuestion()
  }, [params, router])

  const handleSubmit = async () => {
    if (!code.trim() || !question) {
      alert("Please write some code before submitting.")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/practice/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          language,
          testCases: question.testCases,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit code")
      }

      setResult(data)
      setShowResult(true)
    } catch (error) {
      alert(error instanceof Error ? error.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-500">Loading question...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!question) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Question not found</h3>
              <Link href="/practice">
                <Button>Back to Practice</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/practice">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Practice
              </Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Problem Description */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{question.title}</CardTitle>
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                  </div>
                  {question.recommendedTimeComplexity && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Time Complexity: {question.recommendedTimeComplexity}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{question.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Examples */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {question.testCases.slice(0, 3).map((testCase, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Example {index + 1}:</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Input:</span>
                            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">{testCase.input}</pre>
                          </div>
                          <div>
                            <span className="font-medium">Output:</span>
                            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">{testCase.expectedOutput}</pre>
                          </div>
                          {testCase.explanation && (
                            <div>
                              <span className="font-medium">Explanation:</span>
                              <p className="mt-1">{testCase.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              {showResult && result && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {result.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      {result.isCorrect ? "Accepted" : "Wrong Answer"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm">{result.feedback}</p>
                      
                      <div className="text-sm">
                        <span className="font-medium">Execution Time:</span> {result.executionTime}ms
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Test Results:</h4>
                        {result.testResults.map((test, index) => (
                          <div key={index} className={`p-3 rounded-lg ${test.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="flex items-center mb-2">
                              {test.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                              )}
                              <span className="font-medium">Test Case {index + 1}</span>
                            </div>
                            {!test.passed && (
                              <div className="text-sm space-y-1">
                                <div><span className="font-medium">Input:</span> {test.input}</div>
                                <div><span className="font-medium">Expected:</span> {test.expectedOutput}</div>
                                <div><span className="font-medium">Got:</span> {test.actualOutput}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Code Editor */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Solution</CardTitle>
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">Language:</label>
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      className="border rounded px-3 py-1"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                      <option value="c">C</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <MonacoCodeEditor
                      value={code}
                      onChange={setCode}
                      language={language}
                      height="400px"
                    />

                    <Button 
                      onClick={handleSubmit} 
                      disabled={submitting || !code.trim()} 
                      className="w-full" 
                      size="lg"
                    >
                      {submitting ? (
                        "Running..."
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Submit Solution
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}