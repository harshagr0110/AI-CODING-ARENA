const { createServer } = require("http")
const { Server } = require("socket.io")

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Game timers storage
const gameTimers = new Map()
// Track game participants and submissions
const gameParticipants = new Map()
const gameSubmissions = new Map()
// Track active games to prevent duplicate starts
const activeGames = new Set()

io.on("connection", (socket) => {
  console.log("👤 New client connected:", socket.id)

  socket.on("join-room", ({ roomId, userId }) => {
    console.log(`🚪 User ${userId} joining room ${roomId}`)
    socket.join(roomId)
    socket.emit("room-joined", { roomId, userId })
    socket.to(roomId).emit("player-joined", { userId })
  })

  socket.on("add-participant", ({ gameId, userId }) => {
    const participants = gameParticipants.get(gameId) || new Set()
    participants.add(userId)
    gameParticipants.set(gameId, participants)
  })

  socket.on("game-started", ({ roomId, gameId, game }) => {
    // Prevent duplicate game starts
    if (activeGames.has(gameId)) {
      console.log(`⚠️ Game ${gameId} is already active, ignoring duplicate start`)
      return
    }

    console.log(`🎮 Game started in room ${roomId} with gameId ${gameId}`)
    activeGames.add(gameId)
    
    // Broadcast game start immediately to all players
    io.to(roomId).emit("game-started", { game, roomId, gameId })

    // Initialize game tracking
    gameParticipants.set(gameId, new Set())
    gameSubmissions.set(gameId, new Set())

    // Start the game timer automatically
    const duration = game.durationSeconds || 300
    console.log(`⏰ Auto-starting timer for game ${gameId} with duration ${duration} seconds`)
    
    // Clear existing timer if any
    if (gameTimers.has(gameId)) {
      clearInterval(gameTimers.get(gameId))
      gameTimers.delete(gameId)
    }

    let timeLeft = duration

    const timer = setInterval(() => {
      timeLeft--

      // Broadcast timer update to all players in the room
      io.to(roomId).emit("game-timer", { gameId, timeLeft })
      
      // Only log every 60 seconds or when time is low to reduce spam
      if (timeLeft % 60 === 0 || timeLeft <= 30) {
        console.log(`⏰ Timer: ${timeLeft} seconds left`)
      }

      if (timeLeft <= 0) {
        clearInterval(timer)
        gameTimers.delete(gameId)
        activeGames.delete(gameId)
        io.to(roomId).emit("game-ended", { gameId, reason: "time-up" })
        console.log(`⏰ Timer ended for game ${gameId}`)
        // Call API to set game and room to finished
        fetch("http://localhost:3000/api/games/auto-end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId }),
        })
          .then(res => res.json())
          .then(data => console.log("[auto-end]", data))
          .catch(err => console.error("[auto-end] error", err))
      }
    }, 1000)

    gameTimers.set(gameId, timer)
    
    // Send initial timer state immediately
    io.to(roomId).emit("game-timer", { gameId, timeLeft })
    console.log(`⏰ Initial timer state sent: ${timeLeft} seconds`)
  })

  socket.on("code-submitted", ({ roomId, gameId, userId, result }) => {
    console.log(`📝 Code submitted by ${userId} in room ${roomId}`)
    // Track submission
    const submissions = gameSubmissions.get(gameId) || new Set()
    submissions.add(userId)
    gameSubmissions.set(gameId, submissions)
    socket.to(roomId).emit("submission-update", {
      newSubmission: { userId, result, timestamp: new Date() },
    })
    // End game immediately if correct solution
    if (result.isCorrect) {
      if (gameTimers.has(gameId)) {
        clearInterval(gameTimers.get(gameId))
        gameTimers.delete(gameId)
      }
      activeGames.delete(gameId)
      io.to(roomId).emit("game-ended", {
        gameId,
        reason: "winner-found",
        winner: userId,
        allSubmitted: false,
      })
      console.log(`🏁 Game ended: winner-found for game ${gameId}`)
    }
  })

  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId)
  })

  socket.on("room-deleted", ({ roomId, roomName }) => {
    console.log(`🗑️ Room ${roomId} (${roomName}) deleted`)
    io.to(roomId).emit("room-deleted", { roomId, roomName })
    // Remove all users from the room
    const room = io.sockets.adapter.rooms.get(roomId)
    if (room) {
      room.forEach((socketId) => {
        const socket = io.sockets.sockets.get(socketId)
        if (socket) {
          socket.leave(roomId)
        }
      })
    }
  })

  socket.on("disconnect", (reason) => {
    console.log("👤 Client disconnected:", socket.id, "Reason:", reason)
  })
})

const PORT = 3003

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`)
  console.log(`📡 Accepting connections from: http://localhost:3000`)
})

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down socket server...")
  // Clear all timers
  gameTimers.forEach((timer) => clearInterval(timer))
  gameTimers.clear()
  httpServer.close(() => {
    console.log("✅ Socket server closed")
    process.exit(0)
  })
}) 