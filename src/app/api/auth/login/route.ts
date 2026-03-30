import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { encodeSession } from "@/lib/auth";

const SUPER_USER_USERNAME = process.env.SUPER_USER_USERNAME || "admin";
const SUPER_USER_PASSWORD = process.env.SUPER_USER_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (username === SUPER_USER_USERNAME && password === SUPER_USER_PASSWORD) {
      // Admin session
      const sessionData = { username: "admin", role: "admin" as const, name: "Super User" };
      const response = NextResponse.json({ message: "Login successful", user: sessionData });
      
      const cookieStore = await cookies();
      cookieStore.set("auth-token", encodeSession(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });

      return response;
    }

    // Check Employee database
    await dbConnect();
    const employee = await User.findOne({ username, password, status: "active" });

    if (employee) {
      const sessionData = { 
        username: employee.username, 
        role: employee.role as any, 
        name: employee.name, 
        id: employee._id?.toString() 
      };
      
      const response = NextResponse.json({ message: "Login successful", user: sessionData });
      const cookieStore = await cookies();
      cookieStore.set("auth-token", encodeSession(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (_error: unknown) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
