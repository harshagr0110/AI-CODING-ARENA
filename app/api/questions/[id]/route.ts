import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Props {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            username: true,
          },
        },
      },
    })

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error("Error fetching question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, difficulty, recommendedTimeComplexity, testCases, questionType } = await request.json()

    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (existingQuestion.createdBy !== user.id) {
      return NextResponse.json({ error: "You can only edit your own questions" }, { status: 403 })
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        title,
        description,
        difficulty,
        recommendedTimeComplexity,
        testCases,
        questionType,
      },
    })

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    })

    if (!existingQuestion) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    if (existingQuestion.createdBy !== user.id) {
      return NextResponse.json({ error: "You can only delete your own questions" }, { status: 403 })
    }

    await prisma.question.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}