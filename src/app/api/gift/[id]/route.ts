import { NextRequest, NextResponse } from "next/server";
import { getGiftById } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string" || id.length > 32) {
      return NextResponse.json(
        { error: "Invalid gift ID." },
        { status: 400 }
      );
    }

    const gift = await getGiftById(id);

    if (!gift) {
      return NextResponse.json(
        { error: "Gift not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, gift }, { status: 200 });
  } catch (err) {
    console.error("API /api/gift/[id] error:", err);
    return NextResponse.json(
      { error: "Internal server error fetching gift." },
      { status: 500 }
    );
  }
}

