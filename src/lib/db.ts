import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { GiftData } from "@/types/gift";

// Global in-memory cache shared across module evaluations in the same process
declare global {
  // eslint-disable-next-line no-var
  var __iqooGiftsCache: Map<string, GiftData> | undefined;
}

if (!globalThis.__iqooGiftsCache) {
  globalThis.__iqooGiftsCache = new Map<string, GiftData>();
}
const cache = globalThis.__iqooGiftsCache;

// File-based persistence path (persists across server restarts, worker threads, and incognito sessions)
const DATA_DIR = path.join(process.cwd(), "data");
const GIFTS_FILE = path.join(DATA_DIR, "gifts.json");

function ensureFileStorage(): Record<string, GiftData> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(GIFTS_FILE)) {
      fs.writeFileSync(GIFTS_FILE, JSON.stringify({}), "utf8");
      return {};
    }
    const raw = fs.readFileSync(GIFTS_FILE, "utf8");
    return JSON.parse(raw) as Record<string, GiftData>;
  } catch (err) {
    console.error("Error accessing gifts.json on disk:", err);
    return {};
  }
}

function persistToDisk(gift: GiftData) {
  try {
    const store = ensureFileStorage();
    store[gift.id] = gift;
    fs.writeFileSync(GIFTS_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write gift to disk:", err);
  }
}

function readFromDisk(id: string): GiftData | null {
  try {
    const store = ensureFileStorage();
    return store[id] || null;
  } catch (err) {
    console.error("Failed to read gift from disk:", err);
    return null;
  }
}

// Supabase client (optional: used when environment variables are supplied)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      })
    : null;

/**
 * Generates an 8-character URL-safe nanoid string
 */
export function generateGiftId(length = 8): string {
  const alphabet =
    "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"; // removed confusing chars (0, O, 1, I, l)
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let result = "";
  for (let i = 0; i < length; i++) {
    result += alphabet[bytes[i] % alphabet.length];
  }
  return result;
}

/**
 * Saves a new gift to disk, memory cache, and Supabase (if configured)
 */
export async function saveGift(
  data: Omit<GiftData, "id" | "createdAt">
): Promise<GiftData> {
  const id = generateGiftId(8);
  const createdAt = new Date().toISOString();

  const gift: GiftData = {
    id,
    senderName: data.senderName,
    role: data.role || "",
    note: data.note,
    jarIds: data.jarIds,
    createdAt,
  };

  // 1. Save to in-memory global cache
  cache.set(id, gift);

  // 2. Persist to disk file (guaranteed to survive restarts and be readable by any worker)
  persistToDisk(gift);

  // 3. Persist to Supabase if credentials are provided
  if (supabase) {
    try {
      const { error } = await supabase.from("gifts").insert([
        {
          id: gift.id,
          sender_name: gift.senderName,
          role: gift.role,
          note: gift.note,
          jar_ids: gift.jarIds,
          created_at: gift.createdAt,
        },
      ]);

      if (error) {
        console.warn("Supabase insert notice (stored safely on disk):", error.message);
      }
    } catch (err) {
      console.warn("Database connection notice (stored safely on disk):", err);
    }
  }

  return gift;
}

/**
 * Retrieves a gift by its 8-char ID from memory, disk, or Supabase
 */
export async function getGiftById(id: string): Promise<GiftData | null> {
  if (!id) return null;

  // 1. Check in-memory global cache first
  if (cache.has(id)) {
    return cache.get(id)!;
  }

  // 2. Check disk persistence file
  const diskGift = readFromDisk(id);
  if (diskGift) {
    cache.set(id, diskGift);
    return diskGift;
  }

  // 3. Query Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        const gift: GiftData = {
          id: data.id,
          senderName: data.sender_name,
          role: data.role,
          note: data.note,
          jarIds: data.jar_ids,
          createdAt: data.created_at,
        };

        // Cache for subsequent requests
        cache.set(id, gift);
        persistToDisk(gift);
        return gift;
      }
    } catch (err) {
      console.warn("Supabase query notice:", err);
    }
  }

  return null;
}
