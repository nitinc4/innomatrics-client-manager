import { cookies } from "next/headers";

export interface SessionData {
  username: string;
  role: "admin" | "employee";
  name: string;
  id?: string;
}

/**
 * Server-side utility to extract and decode the user session from the auth cookie.
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (!token || !token.value) {
    return null;
  }

  try {
    // Decoding from base64 (Simple for this serverless implementation)
    const decoded = Buffer.from(token.value, 'base64').toString('utf-8');
    const session = JSON.parse(decoded) as SessionData;
    return session;
  } catch (error) {
    console.error("Session decode failed:", error);
    return null;
  }
}

/**
 * Encodes session data for the cookie.
 */
export function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}
