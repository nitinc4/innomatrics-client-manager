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
  const { name, email, contactNumber, currentPassword, newPassword } = body;

  try {
    const user = await User.findById(userToken.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Handle password change if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
      }
      // Note: Current implementation uses plain text passwords
      if (user.password !== currentPassword) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }
      user.password = newPassword;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;

    await user.save();
    
    // Convert to object and remove password before returning
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
