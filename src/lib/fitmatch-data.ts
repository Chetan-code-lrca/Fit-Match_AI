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
  /** Primary color name (e.g. "black", "olive", "cream") */
  color: string;
  palette: "neutral" | "earth" | "cool" | "warm" | "monochrome";
  occasion: WardrobeOccasion[];
  season: Array<"spring" | "summer" | "autumn" | "winter">;
  tags: string[];
  /** Original uploaded image URL */
  imageUrl?: string;
  /** URL of the background-removed / cropped clothing item image */
  extractedItemImage?: string;
  /** Style type e.g. "minimal", "streetwear", "smart", "utility" */
  style?: string;
  /** Fabric or texture e.g. "cotton", "denim", "knit", "fleece" */
  fabric?: string;
  /** Visual pattern e.g. "solid", "striped", "graphic", "plaid" */
  pattern?: "solid" | "striped" | "graphic" | "plaid" | "checkered" | "floral";
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
    style: "streetwear",
    fabric: "fleece",
    pattern: "solid",
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
    style: "minimal",
    fabric: "cotton",
    pattern: "solid",
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
    style: "utility",
    fabric: "cotton",
    pattern: "solid",
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
    style: "smart",
    fabric: "knit",
    pattern: "solid",
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
    style: "utility",
    fabric: "cotton",
    pattern: "solid",
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
    style: "smart",
    fabric: "wool-blend",
    pattern: "solid",
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
    style: "minimal",
    fabric: "denim",
    pattern: "solid",
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
    style: "minimal",
    fabric: "leather",
    pattern: "solid",
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
    style: "smart",
    fabric: "leather",
    pattern: "solid",
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
    style: "minimal",
    pattern: "solid",
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
  "Airport casual fit",
  "Smart casual for a date",
  "Monochrome streetwear look",
  "Minimal weekend outfit",
];
