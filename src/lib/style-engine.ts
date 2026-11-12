import {
  promptSuggestions,
  wardrobeItems as starterWardrobe,
  type OutfitRecommendation,
  type WardrobeItem,
  type WardrobeOccasion,
} from "@/lib/fitmatch-data";

const occasions: WardrobeOccasion[] = [
  "campus",
  "smart-casual",
  "streetwear",
  "travel",
  "night-out",
];

const harmonyMap: Record<WardrobeItem["palette"], WardrobeItem["palette"][]> = {
  neutral: ["earth", "cool", "neutral", "monochrome"],
  earth: ["neutral", "earth", "warm", "monochrome"],
  cool: ["neutral", "cool", "monochrome"],
  warm: ["earth", "neutral", "warm"],
  monochrome: ["monochrome", "neutral", "earth", "cool"],
};

const compatibleStyles: Record<string, string[]> = {
  minimal: ["minimal", "smart", "utility"],
  smart: ["smart", "minimal", "utility"],
  streetwear: ["streetwear", "utility", "minimal"],
  utility: ["utility", "streetwear", "minimal"],
};

const occasionTitles: Record<WardrobeOccasion, string> = {
  campus: "Campus, considered",
  travel: "Comfort-first layers",
  "smart-casual": "Relaxed refinement",
  streetwear: "Off-duty uniform",
  "night-out": "Evening, elevated",
};

function getItem(id: string | undefined, wardrobe: WardrobeItem[]) {
  return wardrobe.find((item) => item.id === id) ?? wardrobe[0];
}

function uniqueItems(items: WardrobeItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function scorePair(base: WardrobeItem, candidate: WardrobeItem) {
  const sameColor = base.color.toLowerCase() === candidate.color.toLowerCase();
  const paletteMatch = harmonyMap[base.palette].includes(candidate.palette);
  const colorHarmonyScore = sameColor ? 98 : paletteMatch ? 88 : 64;

  const baseStyle = base.style;
  const candidateStyle = candidate.style;
  const styleMatch =
    baseStyle && candidateStyle
      ? baseStyle === candidateStyle
        ? 96
        : (compatibleStyles[baseStyle] ?? []).includes(candidateStyle)
          ? 85
          : 67
      : 76;

  return { colorHarmonyScore, aestheticScore: styleMatch };
}

function scoreCandidate(
  base: WardrobeItem,
  candidate: WardrobeItem,
  occasion: WardrobeOccasion,
) {
  const pair = scorePair(base, candidate);
  const occasionScore = candidate.occasion.includes(occasion) ? 100 : 56;
  const versatilityScore = Math.min(100, 68 + candidate.occasion.length * 8);
  const score = Math.round(
    pair.colorHarmonyScore * 0.28 +
      pair.aestheticScore * 0.22 +
      occasionScore * 0.28 +
      versatilityScore * 0.22,
  );

  return { score, ...pair, occasionScore, versatilityScore };
}

function chooseBest(
  candidates: WardrobeItem[],
  base: WardrobeItem,
  occasion: WardrobeOccasion,
  excluded: Set<string>,
) {
  return candidates
    .filter((item) => !excluded.has(item.id))
    .map((item) => ({
      item,
      ...scoreCandidate(base, item, occasion),
    }))
    .sort((left, right) => right.score - left.score)[0]?.item;
}

function pickItems(base: WardrobeItem, wardrobe: WardrobeItem[], occasion: WardrobeOccasion) {
  const excluded = new Set<string>([base.id]);
  const tops = wardrobe.filter((item) => item.category === "top");
  const layers = wardrobe.filter((item) => item.category === "layer");
  const bottoms = wardrobe.filter((item) => item.category === "bottom");
  const shoes = wardrobe.filter((item) => item.category === "shoes");
  const accessories = wardrobe.filter((item) => item.category === "accessory");

  let top: WardrobeItem | undefined;
  let layer: WardrobeItem | undefined;
  let bottom: WardrobeItem | undefined;

  if (base.category === "bottom") {
    top = chooseBest(tops, base, occasion, excluded);
    if (top) excluded.add(top.id);
    layer = chooseBest(layers, base, occasion, excluded);
    if (layer) excluded.add(layer.id);
  } else if (base.category === "top") {
    bottom = chooseBest(bottoms, base, occasion, excluded);
    if (bottom) excluded.add(bottom.id);
    layer = chooseBest(layers, base, occasion, excluded);
    if (layer) excluded.add(layer.id);
  } else if (base.category === "layer") {
    top = chooseBest(tops, base, occasion, excluded);
    if (top) excluded.add(top.id);
    bottom = chooseBest(bottoms, base, occasion, excluded);
    if (bottom) excluded.add(bottom.id);
  } else {
    top = chooseBest(tops, base, occasion, excluded);
    if (top) excluded.add(top.id);
    bottom = chooseBest(bottoms, base, occasion, excluded);
    if (bottom) excluded.add(bottom.id);
  }

  const shoe =
    base.category === "shoes"
      ? base
      : chooseBest(shoes, base, occasion, excluded);
  if (shoe) excluded.add(shoe.id);

  const accessory =
    base.category === "accessory"
      ? base
      : chooseBest(accessories, base, occasion, excluded);

  return uniqueItems([top, layer, bottom, shoe, accessory, base].filter(Boolean) as WardrobeItem[]);
}

function getOutfitScores(
  items: WardrobeItem[],
  base: WardrobeItem,
  occasion: WardrobeOccasion,
) {
  const companions = items.filter((item) => item.id !== base.id);
  if (companions.length === 0) {
    return {
      aestheticScore: 72,
      colorHarmonyScore: 72,
      occasionMatchScore: 72,
      versatilityScore: 72,
    };
  }

  const pairScores = companions.map((item) => scorePair(base, item));
  const aestheticScore = Math.round(
    pairScores.reduce((total, pair) => total + pair.aestheticScore, 0) / pairScores.length,
  );
  const colorHarmonyScore = Math.round(
    pairScores.reduce((total, pair) => total + pair.colorHarmonyScore, 0) / pairScores.length,
  );
  const occasionMatchScore = Math.round(
    (items.filter((item) => item.occasion.includes(occasion)).length / items.length) * 100,
  );
  const versatilityScore = Math.round(
    (items.reduce((total, item) => total + Math.min(item.occasion.length, 5), 0) /
      (items.length * 5)) *
      100,
  );

  return { aestheticScore, colorHarmonyScore, occasionMatchScore, versatilityScore };
}

export function buildRecommendations(
  selectedItemId = "black-hoodie",
  occasion: WardrobeOccasion = "campus",
  customWardrobe?: WardrobeItem[],
) {
  const wardrobe = customWardrobe && customWardrobe.length > 0
    ? customWardrobe
    : starterWardrobe;
  const base = getItem(selectedItemId, wardrobe);
  if (!base) return [];

  const targetOccasions = [occasion, ...occasions.filter((entry) => entry !== occasion)];

  return targetOccasions.map((targetOccasion, index) => {
    const items = pickItems(base, wardrobe, targetOccasion);
    const scores = getOutfitScores(items, base, targetOccasion);
    const confidenceScore = Math.round(
      scores.colorHarmonyScore * 0.3 +
        scores.aestheticScore * 0.25 +
        scores.occasionMatchScore * 0.3 +
        scores.versatilityScore * 0.15,
    );
    const companionNames = items
      .filter((item) => item.id !== base.id)
      .map((item) => item.name.toLowerCase());
    const explanation = companionNames.length
      ? base.name + " anchors the look. " + companionNames.join(", ") +
        " complete it with a considered palette and pieces suited to " +
        targetOccasion.replace("-", " ") + "."
      : "A focused look built around " + base.name +
        ". Add complementary categories to unlock fuller combinations.";

    return {
      id: base.id + "-" + targetOccasion + "-" + index,
      title: occasionTitles[targetOccasion],
      explanation,
      occasion: targetOccasion === occasion
        ? targetOccasion + " focus"
        : targetOccasion + " alternative",
      items,
      aestheticScore: scores.aestheticScore,
      colorHarmonyScore: scores.colorHarmonyScore,
      occasionMatchScore: scores.occasionMatchScore,
      confidenceScore,
    } satisfies OutfitRecommendation;
  });
}

export function buildOutfitOfTheDay(customWardrobe?: WardrobeItem[]) {
  const wardrobe = customWardrobe && customWardrobe.length > 0
    ? customWardrobe
    : starterWardrobe;
  const dateKey = new Date().toISOString().slice(0, 10);
  const dayIndex = dateKey
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0) % wardrobe.length;
  const seedItem = wardrobe[dayIndex] ?? wardrobe[0];

  if (!seedItem) {
    return {
      id: "empty",
      title: "Your wardrobe is waiting",
      explanation: "Add a few pieces to start building complete outfits.",
      occasion: "campus focus",
      items: [],
      aestheticScore: 0,
      colorHarmonyScore: 0,
      occasionMatchScore: 0,
      confidenceScore: 0,
      weatherSummary: "Weather integration is not connected yet.",
      trendSummary: "Style signals will appear as your closet grows.",
      rotationHint: "Add wardrobe pieces to start exploring combinations.",
    };
  }

  const recommendation = buildRecommendations(seedItem.id, "campus", wardrobe)[0];
  return {
    ...recommendation,
    weatherSummary: "Live weather matching is not connected yet.",
    trendSummary: "Style cues are based on closet metadata, not a live trend feed.",
    rotationHint: "Try a different anchor piece to discover another combination.",
  };
}

export type GeneratedOutfit = {
  outfitName: string;
  score: number;
  reasoning: string;
  occasion: string;
  items: WardrobeItem[];
};

export function generateOutfits(
  baseItemId?: string,
  count = 4,
  customWardrobe?: WardrobeItem[],
  preferredOccasion: WardrobeOccasion = "campus",
): GeneratedOutfit[] {
  const wardrobe = customWardrobe && customWardrobe.length > 0
    ? customWardrobe
    : starterWardrobe;
  if (wardrobe.length === 0) return [];

  const targetOccasions = [
    preferredOccasion,
    ...occasions.filter((entry) => entry !== preferredOccasion),
  ];
  const availableBases = baseItemId
    ? [getItem(baseItemId, wardrobe)].filter((item): item is WardrobeItem => Boolean(item))
    : wardrobe.filter((item) =>
        item.category === "top" ||
        item.category === "layer" ||
        item.category === "bottom",
      );

  if (availableBases.length === 0) return [];

  const results: GeneratedOutfit[] = [];
  const seen = new Set<string>();
  let index = 0;

  while (results.length < count && index < count * targetOccasions.length * 2) {
    const base = availableBases[index % availableBases.length];
    const targetOccasion = targetOccasions[index % targetOccasions.length];
    index += 1;
    const key = base.id + ":" + targetOccasion;
    if (seen.has(key)) continue;
    seen.add(key);

    const recommendation = buildRecommendations(base.id, targetOccasion, wardrobe)[0];
    if (!recommendation) continue;
    results.push({
      outfitName: recommendation.title,
      score: recommendation.confidenceScore,
      reasoning: recommendation.explanation,
      occasion: recommendation.occasion,
      items: recommendation.items,
    });
  }

  return results;
}

export function buildChatReply(prompt: string, customWardrobe?: WardrobeItem[]) {
  const normalizedPrompt = prompt.toLowerCase();
  const wardrobe = customWardrobe && customWardrobe.length > 0
    ? customWardrobe
    : starterWardrobe;

  function recommend(
    predicate: (item: WardrobeItem) => boolean,
    occasion: WardrobeOccasion,
  ) {
    const anchor = wardrobe.find(predicate) ?? wardrobe[0];
    return anchor ? buildRecommendations(anchor.id, occasion, wardrobe) : [];
  }

  if (normalizedPrompt.includes("white sneakers") || normalizedPrompt.includes("white shoes")) {
    return {
      message: "White sneakers work well with grounded neutrals and a clean contrast. I have built a look around the closest matching pair in your closet.",
      recommendations: recommend(
        (item) => item.category === "shoes" && item.color.toLowerCase().includes("white"),
        "campus",
      ),
    };
  }

  if (
    normalizedPrompt.includes("all-black") ||
    normalizedPrompt.includes("all black") ||
    normalizedPrompt.includes("monochrome") ||
    (normalizedPrompt.includes("black") && normalizedPrompt.includes("hoodie"))
  ) {
    return {
      message: "A monochrome look works best when proportions and textures do the work. I have used a dark piece from your closet as the anchor.",
      recommendations: recommend(
        (item) => (item.category === "layer" || item.category === "top") &&
          (item.color.toLowerCase() === "black" || item.palette === "monochrome"),
        "streetwear",
      ),
    };
  }

  if (
    normalizedPrompt.includes("college") ||
    normalizedPrompt.includes("campus") ||
    normalizedPrompt.includes("class") ||
    normalizedPrompt.includes("university")
  ) {
    return {
      message: "For campus, prioritise comfort, repeatability and pieces that work across a long day. Here is a look from your closet.",
      recommendations: recommend(
        (item) => (item.category === "top" || item.category === "layer") && item.occasion.includes("campus"),
        "campus",
      ),
    };
  }

  if (
    normalizedPrompt.includes("travel") ||
    normalizedPrompt.includes("airport") ||
    normalizedPrompt.includes("flight") ||
    normalizedPrompt.includes("trip")
  ) {
    return {
      message: "Travel looks benefit from comfortable layers and easy-to-pair colours. I have kept the combination practical.",
      recommendations: recommend(
        (item) => (item.category === "top" || item.category === "layer") && item.occasion.includes("travel"),
        "travel",
      ),
    };
  }

  if (
    normalizedPrompt.includes("date") ||
    normalizedPrompt.includes("night out") ||
    normalizedPrompt.includes("night-out") ||
    normalizedPrompt.includes("dinner") ||
    normalizedPrompt.includes("evening")
  ) {
    return {
      message: "For an evening, use sharper contrast and a more considered silhouette. This combination leans polished without overdoing it.",
      recommendations: recommend(
        (item) => (item.category === "top" || item.category === "layer") && item.occasion.includes("night-out"),
        "night-out",
      ),
    };
  }

  if (
    normalizedPrompt.includes("smart casual") ||
    normalizedPrompt.includes("smart-casual") ||
    normalizedPrompt.includes("minimal") ||
    normalizedPrompt.includes("clean")
  ) {
    return {
      message: "Smart casual works through balance: relaxed pieces with a structured element and clean footwear.",
      recommendations: recommend(
        (item) => item.style === "smart" && (item.category === "top" || item.category === "layer" || item.category === "bottom"),
        "smart-casual",
      ),
    };
  }

  if (
    normalizedPrompt.includes("streetwear") ||
    normalizedPrompt.includes("street") ||
    normalizedPrompt.includes("hype") ||
    normalizedPrompt.includes("casual")
  ) {
    return {
      message: "Streetwear is about proportion, texture and deliberate contrast. I have built around one of your more casual pieces.",
      recommendations: recommend(
        (item) => item.style === "streetwear" || item.style === "utility",
        "streetwear",
      ),
    };
  }

  if (normalizedPrompt.includes("olive") || normalizedPrompt.includes("earth")) {
    return {
      message: "Earth tones pair naturally with neutrals and muted shades. An earth-palette piece can anchor a grounded, easy-to-style look.",
      recommendations: recommend((item) => item.palette === "earth", "smart-casual"),
    };
  }

  return {
    message: "I can help with prompts like " + promptSuggestions.map((entry) => '"' + entry + '"').join(", ") + ".",
    recommendations: buildRecommendations(undefined, "campus", wardrobe),
  };
}