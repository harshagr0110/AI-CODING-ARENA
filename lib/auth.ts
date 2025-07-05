import { auth } from "@clerk/nextjs/server"
import { prisma } from "./prisma"

export async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    // Create user in our database if they don't exist
    try {
      const clerkUser = await fetch(`https://api.clerk.dev/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }).then((res) => res.json())

      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          clerkId: userId,
          username: clerkUser.username || clerkUser.email_addresses[0].email_address.split("@")[0],
          email: clerkUser.email_addresses[0].email_address,
        },
      })
    } catch (error) {
      console.error("Error creating user:", error)
      return null
    }
  }

  return user
}
