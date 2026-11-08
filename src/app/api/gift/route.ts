import { NextRequest, NextResponse } from "next/server";
import { saveGift } from "@/lib/db";
import { ITEMS } from "@/lib/iqooModels";

// Basic in-memory rate-limiter: max 20 creations per 5 minutes per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few moments before crafting another gift." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { senderName, role, note, jarIds } = body;

    // Validation: Sender Name (required, 1-60 chars)
    if (!senderName || typeof senderName !== "string" || senderName.trim().length === 0) {
      return NextResponse.json(
        { error: "Sender name is required." },
        { status: 400 }
      );
    }
    if (senderName.trim().length > 60) {
      return NextResponse.json(
        { error: "Sender name cannot exceed 60 characters." },
        { status: 400 }
      );
    }

    // Validation: Role (optional, max 60 chars)
    if (role && (typeof role !== "string" || role.length > 60)) {
      return NextResponse.json(
        { error: "Role cannot exceed 60 characters." },
        { status: 400 }
      );
    }

    // Validation: Note (required, 1-200 chars)
    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return NextResponse.json(
        { error: "A personal Diwali note is required." },
        { status: 400 }
      );
    }
    if (note.trim().length > 200) {
      return NextResponse.json(
        { error: "Note cannot exceed 200 characters." },
        { status: 400 }
      );
    }

    // Validation: jarIds (array of exactly 6 items from known items)
    const validItemIds = new Set(ITEMS.map((item: { id: string }) => item.id));

    if (!Array.isArray(jarIds) || jarIds.length !== 6) {
      return NextResponse.json(
        { error: "Exactly 6 jars must be chosen for the gift box." },
        { status: 400 }
      );
    }

    for (const id of jarIds) {
      if (!validItemIds.has(id)) {
        return NextResponse.json(
          { error: `Invalid jar selection: '${id}'.` },
          { status: 400 }
        );
      }
    }

    // Save gift
    const gift = await saveGift({
      senderName: senderName.trim(),
      role: role ? role.trim() : "",
      note: note.trim(),
      jarIds,
    });

    return NextResponse.json(
      {
        success: true,
        id: gift.id,
        gift,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("API /api/gift error:", err);
    return NextResponse.json(
      { error: "Internal server error creating gift." },
      { status: 500 }
    );
  }
}

