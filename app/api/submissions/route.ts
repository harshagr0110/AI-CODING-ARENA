import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { evaluateCode } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { roomId, code, language = "cpp" } = await request.json()
    if (!roomId || !code) return NextResponse.json({ error: "Room ID and code are required" }, { status: 400 })

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room || room.status !== "in_progress")
      return NextResponse.json({ error: "Room not found or game not active" }, { status: 400 })

    const existingSubmission = await prisma.submission.findFirst({ where: { roomId, userId: user.id } })
    if (existingSubmission)
      return NextResponse.json({ error: "You have already submitted a solution" }, { status: 400 })

    const challenge = {
      title: room.challengeTitle || "Coding Challenge",
      description: room.challengeDescription || "",
      examples: room.challengeExamples ? JSON.parse(room.challengeExamples) : [],
    }

    let evaluation = await evaluateCode(code, challenge).catch(() => ({
      isCorrect: false,
      feedback: "Evaluation failed. Please try again.",
      score: 0,
      timeComplexity: "Unknown",
      spaceComplexity: "Unknown",
    }))

    const submission = await prisma.submission.create({
      data: {
        id: crypto.randomUUID(),
        roomId,
        userId: user.id,
        code: code.trim(),
        language,
        isCorrect: evaluation.isCorrect,
        aiFeedback: evaluation.feedback,
        timeComplexity: evaluation.timeComplexity,
        spaceComplexity: evaluation.spaceComplexity,
        score: evaluation.score,
      },
    })

    if (evaluation.isCorrect) {
      await prisma.room.update({
        where: { id: roomId },
        data: { winnerId: user.id, status: "finished", endedAt: new Date() },
      })
      await prisma.user.update({
        where: { id: user.id },
        data: {
          gamesPlayed: { increment: 1 },
          gamesWon: { increment: 1 },
          totalScore: { increment: evaluation.score },
        },
      })
    }

    return NextResponse.json({
      message: "Submission evaluated successfully",
      submission: {
        id: submission.id,
        isCorrect: submission.isCorrect,
        score: submission.score,
        aiFeedback: submission.aiFeedback,
        timeComplexity: submission.timeComplexity,
        spaceComplexity: submission.spaceComplexity,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
