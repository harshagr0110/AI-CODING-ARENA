const { createServer } = require("http")
const { Server } = require("socket.io")

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Game timers storage
const gameTimers = new Map()

io.on("connection", (socket) => {
  console.log("👤 New client connected:", socket.id)

  socket.on("join-room", ({ roomId, userId }) => {
    console.log(`🚪 User ${userId} joining room ${roomId}`)
    socket.join(roomId)
    socket.emit("room-joined", { roomId, userId })
    socket.to(roomId).emit("player-joined", { userId })
  })

  socket.on("code-submitted", ({ roomId, gameId, userId, result }) => {
    console.log(`📝 Code submitted by ${userId} in room ${roomId}`)
    socket.to(roomId).emit("submission-update", {
      newSubmission: { userId, result, timestamp: new Date() },
    })

    // If correct solution, end game
    if (result.isCorrect) {
      if (gameTimers.has(gameId)) {
        clearInterval(gameTimers.get(gameId))
        gameTimers.delete(gameId)
      }
      io.to(roomId).emit("game-ended", {
        gameId,
        reason: "winner-found",
        winner: userId,
      })
    }
  })

  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId)
    console.log(`🚪 User left room ${roomId}`)
  })

  socket.on("disconnect", (reason) => {
    console.log("👤 Client disconnected:", socket.id, "Reason:", reason)
  })
})

const PORT = process.env.SOCKET_PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`📡 Accepting connections from: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Shutting down Socket.IO server...")
  gameTimers.forEach((timer) => clearInterval(timer))
  gameTimers.clear()
  httpServer.close(() => {
    console.log("✅ Socket.IO server closed")
    process.exit(0)
  })
})
