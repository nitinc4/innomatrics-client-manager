import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const clients = await request.json();

    if (!Array.isArray(clients)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array of clients." }, { status: 400 });
    }

    // Filter out invalid items or minimal validation
    const validClients = clients.filter(c => c.name && c.contactNumber);

    if (validClients.length === 0) {
      return NextResponse.json({ error: "No valid clients found in the provided data." }, { status: 400 });
    }

    const result = await Client.insertMany(validClients);

    return NextResponse.json({ 
      message: `Successfully uploaded ${result.length} clients.`,
      count: result.length 
    });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: error.message || "Bulk upload failed" }, { status: 500 });
  }
}
