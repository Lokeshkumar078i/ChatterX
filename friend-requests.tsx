"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { FriendRequest } from "@/lib/types"
import { getFriendRequests, respondToFriendRequest } from "@/lib/actions"

interface FriendRequestsProps {
  userId: string
}

export function FriendRequests({ userId }: FriendRequestsProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFriendRequests() {
      try {
        const data = await getFriendRequests(userId)
        setRequests(data)
      } catch (error) {
        console.error("Failed to load friend requests", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFriendRequests()
  }, [userId])

  async function handleResponse(requestId: string, accept: boolean) {
    try {
      await respondToFriendRequest(requestId, accept)
      // Remove the request from the list
      setRequests(requests.filter((req) => req.id !== requestId))
    } catch (error) {
      console.error("Failed to respond to friend request", error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading friend requests...</div>
  }

  if (requests.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No pending friend requests</div>
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="flex items-center justify-between p-3 border rounded-md">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage
                src={request.sender.avatar || "/placeholder.svg?height=40&width=40"}
                alt={request.sender.username}
              />
              <AvatarFallback>{request.sender.username.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{request.sender.username}</p>
              <p className="text-sm text-muted-foreground">Wants to connect</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleResponse(request.id, false)}>
              Decline
            </Button>
            <Button size="sm" onClick={() => handleResponse(request.id, true)}>
              Accept
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

