import { db } from "./db"
import type { User } from "./types"

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        createdAt: true,
      },
    })

    return user
  } catch (error) {
    console.error("Get user profile error:", error)
    return null
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        createdAt: true,
      },
    })

    return user
  } catch (error) {
    console.error("Get user by ID error:", error)
    return null
  }
}

export async function getFriends(userId: string): Promise<User[]> {
  try {
    const friendships = await db.friendship.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            email: true,
            mobile: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    })

    return friendships.map((friendship) => friendship.friend)
  } catch (error) {
    console.error("Get friends error:", error)
    return []
  }
}

export async function searchUsers(query: string, currentUserId: string): Promise<User[]> {
  try {
    const users = await db.user.findMany({
      where: {
        username: {
          contains: query,
          mode: "insensitive",
        },
        NOT: {
          id: currentUserId,
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        mobile: true,
        avatar: true,
        createdAt: true,
      },
      take: 10,
    })

    return users
  } catch (error) {
    console.error("Search users error:", error)
    return []
  }
}

