import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const isDiscarded = searchParams.get("discarded") === "true";
    
    // Default to active clients unless discarded=true is passed
    const query = { isDiscarded };
    const clients = await Client.find(query).sort({ updatedAt: -1 });

    return NextResponse.json(clients);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();
    
    const client = await Client.create(data);
    return NextResponse.json(client, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
