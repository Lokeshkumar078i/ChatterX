"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { register } from "@/lib/actions"

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const mobile = formData.get("mobile") as string
    const password = formData.get("password") as string

    try {
      const result = await register({
        username,
        email,
        mobile,
        password,
      })

      if (result.success) {
        router.push("/login")
      } else {
        setError(result.error || "Registration failed")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-500 text-sm rounded-md">{error}</div>}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" placeholder="Choose a username" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="Enter your email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mobile">Mobile Number</Label>
        <Input id="mobile" name="mobile" type="tel" placeholder="Enter your mobile number" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="Create a password" required />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Register"}
      </Button>
    </form>
  )
}

