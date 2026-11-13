import type { WardrobeItem } from "@/lib/fitmatch-data";
import { databaseRequest, removePrivateImages, signPrivateImage } from "@/lib/supabase-rest";

type WardrobeRow = { id: string; item: WardrobeItem };

export async function readUserWardrobeItems(accessToken: string, userId: string): Promise<WardrobeItem[]> {
  const query = "wardrobe_items?select=id,item&user_id=eq." +
    encodeURIComponent(userId) + "&order=created_at.desc";
  const response = await databaseRequest(query, accessToken);
  if (!response.ok) throw new Error("Unable to load the account wardrobe. Check the database migration.");
  const rows = await response.json() as WardrobeRow[];
  return Promise.all(rows.map(async ({ item }) => {
    const safeItem = { ...item };
    if (safeItem.imageUrl) safeItem.imageUrl = await signPrivateImage(userId, accessToken, safeItem.imageUrl);
    if (safeItem.extractedItemImage) {
      safeItem.extractedItemImage = await signPrivateImage(userId, accessToken, safeItem.extractedItemImage);
    }
    return safeItem;
  }));
}

export async function addUserWardrobeItem(item: WardrobeItem, accessToken: string, userId: string): Promise<void> {
  const response = await databaseRequest("wardrobe_items?on_conflict=user_id,id", accessToken, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ user_id: userId, id: item.id, item }]),
  });
  if (!response.ok) throw new Error("Unable to save this wardrobe item.");
}

export async function deleteUserWardrobeItem(id: string, accessToken: string, userId: string): Promise<void> {
  const response = await databaseRequest(
    "wardrobe_items?select=item&user_id=eq." + encodeURIComponent(userId) + "&id=eq." + encodeURIComponent(id),
    accessToken,
    { method: "DELETE", headers: { Prefer: "return=representation" } },
  );
  if (!response.ok) throw new Error("Unable to remove this wardrobe item.");
  const rows = await response.json() as Array<{ item: WardrobeItem }>;
  const paths = rows.flatMap(({ item }) => [item.imageUrl, item.extractedItemImage])
    .filter((value): value is string => Boolean(value) && value!.startsWith(userId + "/"));
  await removePrivateImages(accessToken, paths);
}
