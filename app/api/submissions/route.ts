import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { evaluateCode } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { gameId, code, language = "cpp" } = await request.json()

    if (!gameId || !code) {
      return NextResponse.json({ error: "Game ID and code are required" }, { status: 400 })
    }

    // Get game details for evaluation
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        room: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    if (game.status !== "active") {
      return NextResponse.json({ error: "Game is not active" }, { status: 400 })
    }

    // Check if user is a participant
    const isParticipant = game.participants.some((p: any) => p.user.id === user.id) || game.room.createdBy === user.id

    if (!isParticipant) {
      return NextResponse.json({ error: "You are not a participant in this game" }, { status: 403 })
    }

    // Check if user already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        gameId,
        userId: user.id,
      },
    })

    if (existingSubmission) {
      return NextResponse.json({ error: "You have already submitted a solution" }, { status: 400 })
    }

    // Prepare challenge data for AI evaluation
    const challenge = {
      title: game.challengeTitle,
      description: game.challengeDescription,
      examples: JSON.parse(game.challengeExamples),
    }

    console.log("Evaluating code with AI...")
    // Evaluate code with AI
    const evaluation = await evaluateCode(code, challenge)

    // Calculate submission time bonus (earlier submissions get more points)
    const gameStartTime = new Date(game.startedAt).getTime()
    const submissionTime = Date.now()
    const timeElapsed = (submissionTime - gameStartTime) / 1000 // seconds
    const maxTime = game.durationSeconds
    const timeBonus = Math.max(0, Math.round(((maxTime - timeElapsed) / maxTime) * 20)) // up to 20 bonus points

    const finalScore = evaluation.isCorrect ? evaluation.score + timeBonus : 0

    // Save submission
    const submission = await prisma.submission.create({
      data: {
        id: crypto.randomUUID(),
        gameId,
        userId: user.id,
        code,
        language,
        isCorrect: evaluation.isCorrect,
        aiFeedback: evaluation.feedback,
        timeComplexity: evaluation.timeComplexity,
        spaceComplexity: evaluation.spaceComplexity,
        score: finalScore,
      },
    })

    // Update all participants' games played count
    const allParticipantIds = [game.room.createdBy, ...game.participants.map((p: any) => p.user.id)]
    await prisma.user.updateMany({
      where: {
        id: {
          in: allParticipantIds,
        },
      },
      data: {
        gamesPlayed: {
          increment: 1,
        },
      },
    })

    // After saving the submission and evaluating correctness:
    if (evaluation.isCorrect) {
      // End the game immediately
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: "finished",
          endedAt: new Date(),
          winnerId: user.id,
        },
      });
      await prisma.room.update({
        where: { id: game.roomId },
        data: { status: "finished" },
      });
      // Award points
      await prisma.user.update({
        where: { id: user.id },
        data: { totalScore: { increment: 5 }, gamesWon: { increment: 1 } },
      });
      // All other participants get -5
      const allParticipantIds = [game.room.createdBy, ...game.participants.map((p: any) => p.user.id)].filter(id => id !== user.id);
      await prisma.user.updateMany({
        where: { id: { in: allParticipantIds } },
        data: { totalScore: { increment: -5 } },
      });
      // Update leaderboard for all
      await prisma.leaderboard.create({
        data: {
          id: crypto.randomUUID(),
          gameId,
          userId: user.id,
          rank: 1,
          score: 5,
          submissionTime: new Date(),
        },
      });
      for (const loserId of allParticipantIds) {
        await prisma.leaderboard.create({
          data: {
            id: crypto.randomUUID(),
            gameId,
            userId: loserId,
            rank: 2,
            score: -5,
            submissionTime: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      ...evaluation,
      submissionId: submission.id,
      finalScore,
      timeBonus,
      rank: evaluation.isCorrect ? await prisma.leaderboard.count({ where: { gameId } }) : null,
    })
  } catch (error) {
    console.error("Error processing submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
