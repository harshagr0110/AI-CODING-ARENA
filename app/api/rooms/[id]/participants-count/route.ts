import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const roomId = params.id
  const count = await prisma.roomParticipant.count({ where: { roomId } })
  return NextResponse.json({ count })
} 