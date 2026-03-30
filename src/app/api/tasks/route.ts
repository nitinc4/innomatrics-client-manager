import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (e) {
    return null;
  }
}

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  
  if (user.role === "admin") {
    const tasks = await Task.find({}).sort({ createdAt: -1 }).populate('clientId', 'name');
    return NextResponse.json(tasks);
  }

  // For employees:
  // 1. Get all clients assigned to this employee
  const Client = (await import("@/models/Client")).default;
  const assignedClients = await Client.find({ assign: user.username }, "_id");
  const assignedClientIds = assignedClients.map(c => c._id);

  // 2. Show tasks created by them OR assigned to a client they manage
  const query = {
    $or: [
      { createdBy: user.username },
      { clientId: { $in: assignedClientIds } }
    ]
  };

  const tasks = await Task.find(query).sort({ createdAt: -1 }).populate('clientId', 'name');
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const body = await req.json();
  try {
    const task = await Task.create({
      ...body,
      createdBy: user.username
    });
    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  const { id, ...updateData } = body;
  
  // Basic security: employees can only update status of their own tasks
  if (user.role === "employee") {
    const task = await Task.findById(id);
    if (!task || task.assignedTo !== user.username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Employees can only update status
    const { status } = updateData;
    const updated = await Task.findByIdAndUpdate(id, { status }, { new: true });
    return NextResponse.json(updated);
  }

  const task = await Task.findByIdAndUpdate(id, updateData, { new: true });
  return NextResponse.json(task);
}

export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await connectDB();
  await Task.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
}
