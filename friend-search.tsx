"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/lib/types"
import { sendFriendRequest } from "@/lib/actions"

export function FriendSearch({ userId }: { userId: string }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [requestStatus, setRequestStatus] = useState<Record<string, string>>({})

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()

    if (!query.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/friends/search?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      setError("Failed to search for users")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendRequest(friendId: string) {
    try {
      setRequestStatus((prev) => ({ ...prev, [friendId]: "loading" }))

      const result = await sendFriendRequest(userId, friendId)

      if (result.success) {
        setRequestStatus((prev) => ({ ...prev, [friendId]: "sent" }))
      } else {
        setRequestStatus((prev) => ({ ...prev, [friendId]: "error" }))
      }
    } catch (error) {
      setRequestStatus((prev) => ({ ...prev, [friendId]: "error" }))
      console.error(error)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for users..."
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>

      {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-md">{error}</div>}

      {isLoading ? (
        <div className="text-center py-4">Searching...</div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user.avatar || "/placeholder.svg?height=40&width=40"} alt={user.username} />
                  <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.username}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant={requestStatus[user.id] === "sent" ? "outline" : "default"}
                disabled={requestStatus[user.id] === "loading" || requestStatus[user.id] === "sent"}
                onClick={() => handleSendRequest(user.id)}
              >
                {requestStatus[user.id] === "loading"
                  ? "Sending..."
                  : requestStatus[user.id] === "sent"
                    ? "Request Sent"
                    : requestStatus[user.id] === "error"
                      ? "Try Again"
                      : "Add Friend"}
              </Button>
            </div>
          ))}
        </div>
      ) : query && !isLoading ? (
        <div className="text-center py-4 text-muted-foreground">No users found</div>
      ) : null}
    </div>
  )
}

