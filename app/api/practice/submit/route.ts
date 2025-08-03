import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { executeCode } from "@/lib/piston"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code, language, testCases } = await request.json()

    if (!code || !language || !testCases) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Execute code using Piston
    const result = await executeCode(code, language, testCases)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error executing code:", error)
    return NextResponse.json(
      { 
        error: "Code execution failed",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}