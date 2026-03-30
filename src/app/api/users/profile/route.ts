import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function GET() {
  const userToken = await getSession();
  if (!userToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(userToken.id).select("-password");
  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const userToken = await getSession();
  if (!userToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { name, email, contactNumber } = body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userToken.id,
      { name, email, contactNumber },
      { new: true }
    ).select("-password");
    
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
