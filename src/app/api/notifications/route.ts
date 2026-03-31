import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Client from "@/models/Client";
import Settings from "@/models/Settings";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const settings = await Settings.findOne() || { remindBefore: 30 };
    const leadTimeMinutes = settings.remindBefore || 30;

    const now = new Date();
    const leadTimeDate = new Date(now.getTime() + leadTimeMinutes * 60000);

    // Build query based on role
    const query: any = {
      isDiscarded: false,
      callback: { $exists: true, $ne: "" }
    };

    if (session.role !== 'admin') {
      query.assign = session.username;
    }

    const callbacks = await Client.find(query).lean();

    // Filter to upcoming only
    const upcoming = callbacks.filter((client: any) => {
      const callbackDate = new Date(client.callback);
      if (isNaN(callbackDate.getTime())) return false;
      return callbackDate >= now && callbackDate <= leadTimeDate;
    });

    return NextResponse.json(upcoming);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
