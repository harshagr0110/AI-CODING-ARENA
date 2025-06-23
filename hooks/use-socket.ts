// C:\Users\HARSH\Downloads\multiplayer-ai-coding-arena\hooks\use-socket.ts
import { useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    let isMounted = true

    const initializeSocket = () => {
      if (connectionAttempts >= maxReconnectAttempts) {
        console.log("❌ Max connection attempts reached")
        return
      }

      try {
        console.log(`🔄 Connecting to Socket.IO server (attempt ${connectionAttempts + 1}/${maxReconnectAttempts})`)

        // Clean up existing socket
        if (socketRef.current) {
          socketRef.current.removeAllListeners()
          socketRef.current.disconnect()
          socketRef.current = null
        }

        if (!isMounted) return

        // Connect to the Socket.IO server on port 3003
        const socketUrl = process.env.NODE_ENV === "production"
          ? window.location.origin.replace(/:\d+/, ":3003") // Replace port with 3003
          : "http://localhost:3003"; // Socket server on port 3003

        socketRef.current = io(socketUrl, {
          transports: ["polling", "websocket"],
          upgrade: true,
          timeout: 20000,
          forceNew: true,
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
        })

        // Event listeners
        socketRef.current.on("connect", () => {
          if (isMounted) {
            console.log("✅ Socket connected successfully!")
            setIsConnected(true)
            setConnectionAttempts(0)
          }
        })

        socketRef.current.on("disconnect", (reason) => {
          if (isMounted) {
            console.log("❌ Socket disconnected:", reason)
            setIsConnected(false)
          }
        })

        socketRef.current.on("connect_error", (error) => {
          if (isMounted) {
            console.error("❌ Socket connection error:", error.message)
            setIsConnected(false)
            setConnectionAttempts((prev) => prev + 1)
          }
        })

        socketRef.current.on("error", (error) => {
          console.error("❌ Socket error:", error)
        })

        // Test connection
        socketRef.current.on("room-joined", (data) => {
          console.log("✅ Successfully joined room:", data)
        })
      } catch (error) {
        console.error("❌ Socket initialization failed:", error)
        if (isMounted) {
          setConnectionAttempts((prev) => prev + 1)
          setIsConnected(false)
        }
      }
    }

    // Start initialization
    initializeSocket()

    return () => {
      isMounted = false
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setIsConnected(false)
    }
  }, [connectionAttempts])

  const reconnect = () => {
    console.log("🔄 Manual reconnect triggered")
    setConnectionAttempts(0)
    // Trigger re-initialization
    setConnectionAttempts(1)
  }

  return {
    socket: socketRef.current,
    isConnected,
    connectionAttempts,
    maxReconnectAttempts,
    reconnect,
  }
}