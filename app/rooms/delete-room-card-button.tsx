"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

interface DeleteRoomCardButtonProps {
  roomId: string
  roomName: string
  isCreator: boolean
}

export function DeleteRoomCardButton({ roomId, roomName, isCreator }: DeleteRoomCardButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  if (!isCreator) {
    return null
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Fetch participant count for the room
      const res = await fetch(`/api/rooms/${roomId}/participants-count`)
      if (!res.ok) throw new Error("Failed to fetch participant count")
      const data = await res.json()
      if (data.count > 0) {
        window.alert("You cannot delete a room while users are inside. Please wait until everyone leaves.")
        setIsDeleting(false)
        return
      }
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete room")
      }
      router.refresh()
    } catch (error) {
      console.error("Error deleting room:", error)
      window.alert("Error deleting room. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="mt-2">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Room</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{roomName}"? This action cannot be undone and will permanently remove:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-6 -mt-2 mb-4">
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>The room and all its data</li>
            <li>All game history and submissions</li>
            <li>All participant information</li>
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete Room"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 