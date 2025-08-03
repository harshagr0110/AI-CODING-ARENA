import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, difficulty, recommendedTimeComplexity, testCases, questionType } = await request.json()

    if (!title || !description || !testCases || !Array.isArray(testCases)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate test cases structure
    for (const testCase of testCases) {
      if (!testCase.input || !testCase.expectedOutput) {
        return NextResponse.json({ error: "Each test case must have input and expectedOutput" }, { status: 400 })
      }
    }

    const question = await prisma.question.create({
      data: {
        id: crypto.randomUUID(),
        title,
        description,
        difficulty: difficulty || "medium",
        recommendedTimeComplexity,
        testCases: testCases,
        questionType: questionType || "normal",
        createdBy: user.id,
      },
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const difficulty = searchParams.get('difficulty')
    const questionType = searchParams.get('questionType')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (difficulty) where.difficulty = difficulty
    if (questionType) where.questionType = questionType

    const questions = await prisma.question.findMany({
      where,
      include: {
        creator: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}