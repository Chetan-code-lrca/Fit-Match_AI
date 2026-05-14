export type WardrobeCategory =
  | "top"
  | "bottom"
  | "layer"
  | "shoes"
  | "accessory";

export type WardrobeOccasion =
  | "campus"
  | "travel"
  | "smart-casual"
  | "streetwear"
  | "night-out";

export type WardrobeItem = {
  id: string;
  name: string;
  category: WardrobeCategory;
  color: string;
  palette: "neutral" | "earth" | "cool" | "warm" | "monochrome";
  occasion: WardrobeOccasion[];
  season: Array<"spring" | "summer" | "autumn" | "winter">;
  tags: string[];
};

export type OutfitRecommendation = {
  id: string;
  title: string;
  explanation: string;
  occasion: string;
  items: WardrobeItem[];
  aestheticScore: number;
  colorHarmonyScore: number;
  occasionMatchScore: number;
  confidenceScore: number;
};

export const wardrobeItems: WardrobeItem[] = [
  {
    id: "black-hoodie",
    name: "Black Oversized Hoodie",
    category: "layer",
    color: "black",
    palette: "monochrome",
    occasion: ["campus", "travel", "streetwear", "night-out"],
    season: ["autumn", "winter", "spring"],
    tags: ["black hoodie", "streetwear layer", "soft fleece"],
  },
  {
    id: "cream-tee",
    name: "Cream Essential Tee",
    category: "top",
    color: "cream",
    palette: "neutral",
    occasion: ["campus", "travel", "smart-casual"],
    season: ["spring", "summer", "autumn"],
    tags: ["cream shirt", "neutral basic", "lightweight"],
  },
  {
    id: "olive-overshirt",
    name: "Olive Utility Overshirt",
    category: "layer",
    color: "olive",
    palette: "earth",
    occasion: ["campus", "travel", "smart-casual"],
    season: ["spring", "autumn", "winter"],
    tags: ["olive layer", "earth-tone jacket", "utility"],
  },
  {
    id: "navy-knit",
    name: "Navy Texture Knit",
    category: "top",
    color: "navy",
    palette: "cool",
    occasion: ["smart-casual", "night-out", "travel"],
    season: ["autumn", "winter", "spring"],
    tags: ["navy top", "texture knit", "elevated"],
  },
  {
    id: "beige-cargo",
    name: "Beige Cargo Pants",
    category: "bottom",
    color: "beige",
    palette: "earth",
    occasion: ["campus", "travel", "streetwear"],
    season: ["spring", "summer", "autumn"],
    tags: ["beige cargo", "relaxed fit", "utility"],
  },
  {
    id: "charcoal-trouser",
    name: "Charcoal Tailored Trouser",
    category: "bottom",
    color: "charcoal",
    palette: "neutral",
    occasion: ["smart-casual", "night-out", "travel"],
    season: ["autumn", "winter", "spring"],
    tags: ["charcoal trouser", "refined", "sleek"],
  },
  {
    id: "black-denim",
    name: "Black Denim",
    category: "bottom",
    color: "black",
    palette: "monochrome",
    occasion: ["campus", "streetwear", "night-out"],
    season: ["spring", "autumn", "winter"],
    tags: ["black denim", "tapered", "versatile"],
  },
  {
    id: "white-sneakers",
    name: "White Minimal Sneakers",
    category: "shoes",
    color: "white",
    palette: "neutral",
    occasion: ["campus", "travel", "smart-casual", "streetwear"],
    season: ["spring", "summer", "autumn"],
    tags: ["white sneakers", "clean leather", "everyday"],
  },
  {
    id: "black-boots",
    name: "Black Chelsea Boots",
    category: "shoes",
    color: "black",
    palette: "monochrome",
    occasion: ["smart-casual", "night-out", "travel"],
    season: ["autumn", "winter", "spring"],
    tags: ["black boots", "sleek", "elevated"],
  },
  {
    id: "silver-watch",
    name: "Silver Chronograph Watch",
    category: "accessory",
    color: "silver",
    palette: "neutral",
    occasion: ["smart-casual", "night-out", "travel", "campus"],
    season: ["spring", "summer", "autumn", "winter"],
    tags: ["watch", "accessory", "polished"],
  },
];

export const userProfile = {
  name: "Alex",
  stylePersona: "Premium minimal streetwear",
  skinTone: "Warm neutral",
  favoriteColors: ["black", "olive", "cream", "charcoal"],
  preferredOccasions: ["campus", "travel", "smart-casual"],
  dislikedPairs: ["orange + neon green", "red + lime"],
};

export const recentOutfits = [
  {
    id: "recent-1",
    title: "Muted travel layers",
    wornOn: "Yesterday",
    items: ["olive-overshirt", "cream-tee", "charcoal-trouser", "white-sneakers"],
  },
  {
    id: "recent-2",
    title: "Campus monochrome",
    wornOn: "2 days ago",
    items: ["black-hoodie", "black-denim", "white-sneakers"],
  },
];

export const weatherModes = [
  { label: "Sunny 27°C", key: "sunny", boost: "light" },
  { label: "Cloudy 21°C", key: "cloudy", boost: "neutral" },
  { label: "Rainy 18°C", key: "rainy", boost: "layered" },
];

export const trendSignals = [
  "Monochrome layering",
  "Earth-tone neutrals",
  "Quiet luxury sneakers",
];

export const uploadFormats = ["image/jpeg", "image/png", "image/webp"];

export const promptSuggestions = [
  "What should I wear for college?",
  "Suggest an outfit for night travel",
  "I want an all-black fit",
  "Suggest combinations with white sneakers",
];
