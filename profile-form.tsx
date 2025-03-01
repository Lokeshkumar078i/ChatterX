"use client"

import type React from "react"

import { useState } from "react"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updateProfile } from "@/lib/actions"

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setSuccess(false)
    setError("")

    const formData = new FormData(event.currentTarget)
    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const mobile = formData.get("mobile") as string

    try {
      const result = await updateProfile({
        userId: user.id,
        username,
        email,
        mobile,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "Failed to update profile")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="p-3 bg-green-50 text-green-600 text-sm rounded-md">Profile updated successfully!</div>
      )}

      {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-md">{error}</div>}

      <div className="flex flex-col items-center space-y-4">
        <Avatar className="w-24 h-24">
          <AvatarImage src={user.avatar || "/placeholder.svg?height=96&width=96"} alt={user.username} />
          <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <Button variant="outline" size="sm" type="button">
          Change Avatar
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userId">User ID</Label>
          <Input id="userId" value={user.id} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" defaultValue={user.username} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={user.email} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile Number</Label>
          <Input id="mobile" name="mobile" type="tel" defaultValue={user.mobile} required />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}

