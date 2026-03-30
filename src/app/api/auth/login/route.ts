import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const SUPER_USER_USERNAME = process.env.SUPER_USER_USERNAME || "admin";
const SUPER_USER_PASSWORD = process.env.SUPER_USER_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (username === SUPER_USER_USERNAME && password === SUPER_USER_PASSWORD) {
      // Set an auth cookie
      const response = NextResponse.json({ message: "Login successful" });
      
      const cookieStore = await cookies();
      cookieStore.set("auth-token", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
