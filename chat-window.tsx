"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User, Message } from "@/lib/types"
import { getMessages, sendMessage } from "@/lib/actions"

interface ChatWindowProps {
  currentUserId: string
  friend: User
}

export function ChatWindow({ currentUserId, friend }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await getMessages(currentUserId, friend.id)
        setMessages(data)
      } catch (error) {
        console.error("Failed to load messages", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()

    // Set up WebSocket connection for real-time messages
    const socket = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/chat/ws?userId=${currentUserId}&friendId=${friend.id}`,
    )

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setMessages((prev) => [...prev, message])
    }

    return () => {
      socket.close()
    }
  }, [currentUserId, friend.id])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()

    if (!newMessage.trim()) return

    try {
      const message = await sendMessage(currentUserId, friend.id, newMessage)
      setMessages((prev) => [...prev, message])
      setNewMessage("")
    } catch (error) {
      console.error("Failed to send message", error)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden h-[calc(100vh-200px)] flex flex-col">
      <div className="p-4 border-b bg-muted/50 flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={friend.avatar || "/placeholder.svg?height=40&width=40"} alt={friend.username} />
          <AvatarFallback>{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold">{friend.username}</h2>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-4">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUserId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.senderId === currentUserId ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p>{message.content}</p>
                <div className="text-xs mt-1 opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString()}
                  {message.seen && message.senderId === currentUserId && " • Seen"}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

