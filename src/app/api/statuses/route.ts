import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Status from "@/models/Status";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function isAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return false;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.role === "admin";
  } catch (e) {
    return false;
  }
}

export async function GET() {
  await connectDB();
  const statuses = await Status.find({}).sort({ order: 1 });
  return NextResponse.json(statuses);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const body = await req.json();
  try {
    const status = await Status.create(body);
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const body = await req.json();
  const { id, ...updateData } = body;
  try {
    const status = await Status.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await connectDB();
  
  // Safety check: ensure status is not in use by any client
  const targetStatus = await Status.findById(id);
  if (targetStatus) {
    const Client = (await import("@/models/Client")).default;
    const usageCount = await Client.countDocuments({ status: targetStatus.name });
    if (usageCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete status "${targetStatus.name}" because it is currently assigned to ${usageCount} clients.` 
      }, { status: 400 });
    }
  }

  await Status.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
}
