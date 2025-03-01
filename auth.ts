import { cookies } from "next/headers"
import { jwtVerify, SignJWT } from "jose"
import type { Session } from "./types"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-at-least-32-characters")

export async function createSession(userId: string): Promise<string> {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const session: Session = {
    userId,
    expires,
  }

  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires.toISOString())
    .sign(JWT_SECRET)

  return token
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = cookies()
  const token = cookieStore.get("session")?.value

  if (!token) {
    return null
  }

  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    const session = verified.payload as unknown as Session

    if (new Date(session.expires) < new Date()) {
      return null
    }

    return session
  } catch (error) {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = cookies()
  cookieStore.delete("session")
}

