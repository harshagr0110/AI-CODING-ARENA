import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, isPrivate, maxPlayers } = await request.json()

    let joinCode = generateJoinCode()

    // Ensure join code is unique with better error handling
    try {
      let existingRoom = await prisma.room.findFirst({
        where: {
          joinCode: {
            equals: joinCode,
          },
        },
      })

      let attempts = 0
      while (existingRoom && attempts < 10) {
        joinCode = generateJoinCode()
        existingRoom = await prisma.room.findFirst({
          where: {
            joinCode: {
              equals: joinCode,
            },
          },
        })
        attempts++
      }

      if (attempts >= 10) {
        console.warn("Could not generate unique join code after 10 attempts")
        // Use timestamp-based code as fallback
        joinCode = Date.now().toString(36).toUpperCase().slice(-6)
      }
    } catch (error) {
      console.error("Error checking join code uniqueness:", error)
      // If there's an issue with join code checking, use timestamp-based fallback
      joinCode = Date.now().toString(36).toUpperCase().slice(-6)
    }

    const room = await prisma.room.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description,
        isPrivate,
        joinCode,
        maxPlayers: Number.parseInt(maxPlayers),
        createdBy: user.id,
      },
    })

    return NextResponse.json(room)
  } catch (error: unknown) {
    console.error("Error creating room:", error)

    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Room name already exists",
          details: "Please choose a different room name.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 },
    )
  }
}
