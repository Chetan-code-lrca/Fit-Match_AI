import fs from "fs";
import path from "path";

import type { WardrobeItem } from "@/lib/fitmatch-data";

const DATA_DIR = path.join(process.cwd(), "data");
const WARDROBE_FILE = path.join(DATA_DIR, "wardrobe.json");

export function readUserWardrobeItems(): WardrobeItem[] {
  try {
    if (!fs.existsSync(WARDROBE_FILE)) return [];
    const raw = fs.readFileSync(WARDROBE_FILE, "utf-8").trim();
    if (!raw || raw === "[]") return [];
    return JSON.parse(raw) as WardrobeItem[];
  } catch {
    return [];
  }
}

export function writeUserWardrobeItems(items: WardrobeItem[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(WARDROBE_FILE, JSON.stringify(items, null, 2));
}

export function addUserWardrobeItem(item: WardrobeItem): WardrobeItem[] {
  const items = readUserWardrobeItems();
  const existingIndex = items.findIndex((i) => i.id === item.id);
  if (existingIndex >= 0) {
    items[existingIndex] = item;
  } else {
    items.push(item);
  }
  writeUserWardrobeItems(items);
  return items;
}

export function deleteUserWardrobeItem(id: string): WardrobeItem[] {
  const items = readUserWardrobeItems().filter((i) => i.id !== id);
  writeUserWardrobeItems(items);
  return items;
}
