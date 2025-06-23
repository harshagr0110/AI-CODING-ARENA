const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

function generateJoinCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function fixJoinCodes() {
  try {
    console.log("🔄 Fixing join codes for existing rooms...")

    // Get all rooms without join codes
    const roomsWithoutCodes = await prisma.room.findMany({
      where: {
        joinCode: null,
      },
    })

    console.log(`Found ${roomsWithoutCodes.length} rooms without join codes`)

    // Generate unique join codes for each room
    for (const room of roomsWithoutCodes) {
      let joinCode = generateJoinCode()

      // Ensure uniqueness
      let existingRoom = await prisma.room.findFirst({
        where: { joinCode },
      })

      let attempts = 0
      while (existingRoom && attempts < 10) {
        joinCode = generateJoinCode()
        existingRoom = await prisma.room.findFirst({
          where: { joinCode },
        })
        attempts++
      }

      // Update the room
      await prisma.room.update({
        where: { id: room.id },
        data: { joinCode },
      })

      console.log(`✅ Updated room "${room.name}" with join code: ${joinCode}`)
    }

    console.log("🎉 All rooms now have join codes!")
  } catch (error) {
    console.error("❌ Error fixing join codes:", error)
  } finally {
    await prisma.$disconnect()
  }
}

fixJoinCodes()
