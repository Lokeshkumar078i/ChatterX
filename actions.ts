"use server"

import { cookies } from "next/headers"
import { createSession, deleteSession } from "./auth"
import { db } from "./db"
import type { FriendRequest, Message } from "./types"
import { hash, compare } from "bcrypt"

// Authentication actions
export async function login(email: string, password: string) {
  try {
    // In a real app, fetch user from database
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    const passwordMatch = await compare(password, user.password)

    if (!passwordMatch) {
      return { success: false, error: "Invalid email or password" }
    }

    const token = await createSession(user.id)

    const cookieStore = cookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function register(data: {
  username: string
  email: string
  mobile: string
  password: string
}) {
  try {
    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }, { mobile: data.mobile }],
      },
    })

    if (existingUser) {
      return { success: false, error: "User with this email, username, or mobile already exists" }
    }

    // Hash the password
    const hashedPassword = await hash(data.password, 10)

    // Create new user
    const user = await db.user.create({
      data: {
        username: data.username,
        email: data.email,
        mobile: data.mobile,
        password: hashedPassword,
      },
    })

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function logout() {
  try {
    await deleteSession()
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "Failed to logout" }
  }
}

// Profile actions
export async function updateProfile(data: {
  userId: string
  username: string
  email: string
  mobile: string
}) {
  try {
    // Check if email or username is already taken by another user
    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }, { mobile: data.mobile }],
        NOT: {
          id: data.userId,
        },
      },
    })

    if (existingUser) {
      return { success: false, error: "Email, username, or mobile is already taken" }
    }

    // Update user profile
    await db.user.update({
      where: { id: data.userId },
      data: {
        username: data.username,
        email: data.email,
        mobile: data.mobile,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Update profile error:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

// Friend request actions
export async function getFriendRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const requests = await db.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: "pending",
      },
      include: {
        sender: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return requests
  } catch (error) {
    console.error("Get friend requests error:", error)
    return []
  }
}

export async function sendFriendRequest(senderId: string, receiverUsername: string) {
  try {
    // Find receiver by username
    const receiver = await db.user.findUnique({
      where: { username: receiverUsername },
    })

    if (!receiver) {
      return { success: false, error: "User not found" }
    }

    // Check if users are already friends
    const existingFriendship = await db.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiver.id },
          { userId: receiver.id, friendId: senderId },
        ],
      },
    })

    if (existingFriendship) {
      return { success: false, error: "You are already friends with this user" }
    }

    // Check if there's already a pending request
    const existingRequest = await db.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: senderId },
        ],
        status: "pending",
      },
    })

    if (existingRequest) {
      return { success: false, error: "A friend request already exists" }
    }

    // Create friend request
    await db.friendRequest.create({
      data: {
        senderId,
        receiverId: receiver.id,
        status: "pending",
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Send friend request error:", error)
    return { success: false, error: "Failed to send friend request" }
  }
}

export async function respondToFriendRequest(requestId: string, accept: boolean) {
  try {
    const request = await db.friendRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      return { success: false, error: "Friend request not found" }
    }

    if (accept) {
      // Create friendship
      await db.friendship.createMany({
        data: [
          { userId: request.senderId, friendId: request.receiverId },
          { userId: request.receiverId, friendId: request.senderId },
        ],
      })

      // Update request status
      await db.friendRequest.update({
        where: { id: requestId },
        data: { status: "accepted" },
      })
    } else {
      // Update request status
      await db.friendRequest.update({
        where: { id: requestId },
        data: { status: "rejected" },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Respond to friend request error:", error)
    return { success: false, error: "Failed to respond to friend request" }
  }
}

// Chat actions
export async function getMessages(userId: string, friendId: string): Promise<Message[]> {
  try {
    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Mark messages as seen
    await db.message.updateMany({
      where: {
        senderId: friendId,
        receiverId: userId,
        seen: false,
      },
      data: {
        seen: true,
      },
    })

    return messages
  } catch (error) {
    console.error("Get messages error:", error)
    return []
  }
}

export async function sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
  try {
    const message = await db.message.create({
      data: {
        senderId,
        receiverId,
        content,
        seen: false,
      },
    })

    return message
  } catch (error) {
    console.error("Send message error:", error)
    throw new Error("Failed to send message")
  }
}

