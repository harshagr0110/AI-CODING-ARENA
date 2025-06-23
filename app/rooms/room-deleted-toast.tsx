"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function RoomDeletedToast() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    if (!searchParams) return
    
    const deleted = searchParams.get("deleted")
    if (deleted === "true") {
      toast({
        title: "Room Deleted",
        description: "The room you were in has been deleted by the host.",
        variant: "default",
      })
      
      // Clean up the URL
      const url = new URL(window.location.href)
      url.searchParams.delete("deleted")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, toast])

  return null
} 