import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Client from "@/models/Client";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const users = await User.find({ role: "employee" }).lean().sort({ createdAt: -1 });
    
    // Fetch stats for each employee
    const usersWithStats = await Promise.all(users.map(async (u: any) => {
      const stats = await Client.aggregate([
        { $match: { assign: u.username } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      
      const statsObj: Record<string, number> = {};
      stats.forEach(s => {
        if (s._id) statsObj[s._id] = s.count;
      });
      
      return { ...u, stats: statsObj };
    }));

    return NextResponse.json(usersWithStats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    
    // Simple check for existing username
    const existing = await User.findOne({ username: data.username });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const user = await User.create(data);
    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await dbConnect();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "User deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id, ...data } = await request.json();

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Check if new username exists (if changing)
    if (data.username) {
      const existing = await User.findOne({ username: data.username, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }
    }

    const updated = await User.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
