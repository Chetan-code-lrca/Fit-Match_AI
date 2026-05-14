import {
  promptSuggestions,
  recentOutfits,
  trendSignals,
  userProfile,
  wardrobeItems,
  type OutfitRecommendation,
  type WardrobeItem,
  type WardrobeOccasion,
} from "@/lib/fitmatch-data";

const harmonyMap: Record<WardrobeItem["palette"], WardrobeItem["palette"][]> = {
  neutral: ["earth", "cool", "neutral", "monochrome"],
  earth: ["neutral", "earth", "warm", "monochrome"],
  cool: ["neutral", "cool", "monochrome"],
  warm: ["earth", "neutral", "warm"],
  monochrome: ["monochrome", "neutral", "earth", "cool"],
};

const occasionBoost: Record<WardrobeOccasion, number> = {
  campus: 90,
  travel: 88,
  "smart-casual": 92,
  streetwear: 94,
  "night-out": 90,
};

function getItem(id: string) {
  return wardrobeItems.find((item) => item.id === id) ?? wardrobeItems[0];
}

function scorePair(base: WardrobeItem, candidate: WardrobeItem) {
  const sameColor = base.color === candidate.color;
  const paletteMatch = harmonyMap[base.palette].includes(candidate.palette);
  const favoriteBoost = userProfile.favoriteColors.includes(candidate.color) ? 6 : 0;

  return {
    colorHarmonyScore: Math.min(
      99,
      (sameColor ? 88 : 74) + (paletteMatch ? 14 : 0) + favoriteBoost,
    ),
    aestheticScore: Math.min(
      99,
      78 + (base.palette === candidate.palette ? 8 : 0) + favoriteBoost,
    ),
  };
}

function pickItems(base: WardrobeItem) {
  const bottoms = wardrobeItems.filter(
    (item) => item.category === "bottom" && item.id !== base.id,
  );
  const topsAndLayers = wardrobeItems.filter(
    (item) =>
      (item.category === "top" || item.category === "layer") && item.id !== base.id,
  );
  const shoes = wardrobeItems.filter((item) => item.category === "shoes");
  const accessories = wardrobeItems.filter((item) => item.category === "accessory");

  const rankedBottoms = bottoms
    .map((item) => ({ item, ...scorePair(base, item) }))
    .sort((left, right) => right.colorHarmonyScore - left.colorHarmonyScore);
  const rankedShoes = shoes
    .map((item) => ({ item, ...scorePair(base, item) }))
    .sort((left, right) => right.aestheticScore - left.aestheticScore);
  const rankedLayers = topsAndLayers
    .map((item) => ({ item, ...scorePair(base, item) }))
    .sort((left, right) => right.aestheticScore - left.aestheticScore);

  const firstBottom = rankedBottoms[0]?.item ?? getItem("charcoal-trouser");
  const firstShoe = rankedShoes[0]?.item ?? getItem("white-sneakers");
  const firstLayer = rankedLayers[0]?.item ?? getItem("cream-tee");
  const watch = accessories[0] ?? getItem("silver-watch");

  return base.category === "bottom"
    ? [firstLayer, base, firstShoe, watch]
    : [base, firstBottom, firstShoe, watch];
}

export function buildRecommendations(
  selectedItemId = "black-hoodie",
  occasion: WardrobeOccasion = "campus",
) {
  const base = getItem(selectedItemId);
  const alternatives = Array.from(
    new Set<WardrobeOccasion>([occasion, "campus", "travel", "night-out"]),
  );

  return alternatives
    .map((targetOccasion, index) => {
      const items = pickItems(base);
      const score = items.reduce(
        (accumulator, item) => {
          const pair = scorePair(base, item);
          return {
            aestheticScore: accumulator.aestheticScore + pair.aestheticScore,
            colorHarmonyScore: accumulator.colorHarmonyScore + pair.colorHarmonyScore,
          };
        },
        { aestheticScore: 0, colorHarmonyScore: 0 },
      );

      const averageAesthetic = Math.round(score.aestheticScore / items.length);
      const averageHarmony = Math.round(score.colorHarmonyScore / items.length);
      const occasionMatchScore = Math.round(
        (items.reduce(
          (total, item) => total + (item.occasion.includes(targetOccasion) ? 24 : 12),
          0,
        ) /
          (items.length * 24)) *
          100,
      );
      const confidenceScore = Math.round(
        (averageAesthetic + averageHarmony + occasionBoost[targetOccasion]) / 3,
      );

      return {
        id: `${base.id}-${targetOccasion}-${index}`,
        title:
          targetOccasion === "night-out"
            ? "Sharper contrast set"
            : targetOccasion === "travel"
              ? "Comfort-first travel fit"
              : targetOccasion === "smart-casual"
                ? "Polished minimal set"
                : "Campus-ready daily fit",
        explanation: `This outfit works because ${base.color} anchors the look while ${items
          .slice(1)
          .map((item) => item.color)
          .join(", ")} keep the palette balanced for ${targetOccasion}.`,
        occasion:
          targetOccasion === occasion ? `${targetOccasion} focus` : `${targetOccasion} alternate`,
        items,
        aestheticScore: averageAesthetic,
        colorHarmonyScore: averageHarmony,
        occasionMatchScore,
        confidenceScore,
      } satisfies OutfitRecommendation;
    })
    .sort((left, right) => right.confidenceScore - left.confidenceScore);
}

export function buildOutfitOfTheDay() {
  const dayIndex = new Date().getDate() % wardrobeItems.length;
  const seedItem = wardrobeItems[dayIndex] ?? wardrobeItems[0];
  const recommendation = buildRecommendations(seedItem.id, "smart-casual")[0];
  const lastWornIds = recentOutfits.flatMap((outfit) => outfit.items);
  const rotationHint = recommendation.items.some((item) => lastWornIds.includes(item.id))
    ? "Rotated with a fresher shoe/layer pairing to avoid repeating yesterday’s silhouette."
    : "None of these pieces appeared in your recent rotation, so it feels fresh for today.";

  return {
    ...recommendation,
    weatherSummary: "Cloudy 21°C keeps the look polished with enough layering depth.",
    trendSummary: `${trendSignals[dayIndex % trendSignals.length]} is boosting this recommendation today.`,
    rotationHint,
  };
}

export function buildChatReply(prompt: string) {
  const normalizedPrompt = prompt.toLowerCase();

  if (normalizedPrompt.includes("white sneakers")) {
    return {
      message:
        "White sneakers work best when the rest of the outfit stays clean and contrast-driven. I’d balance them with grounded neutrals from your closet.",
      recommendations: buildRecommendations("white-sneakers", "campus"),
    };
  }

  if (normalizedPrompt.includes("black") || normalizedPrompt.includes("hoodie")) {
    return {
      message:
        "Your black hoodie is the best anchor for a monochrome streetwear look. I paired it with structured bottoms so the fit stays intentional, not flat.",
      recommendations: buildRecommendations("black-hoodie", "streetwear"),
    };
  }

  if (normalizedPrompt.includes("college")) {
    return {
      message:
        "For college, I’d keep the outfit comfortable, low-maintenance, and photo-ready between classes. Neutral layers and sneakers give you that easy premium feel.",
      recommendations: buildRecommendations("cream-tee", "campus"),
    };
  }

  if (normalizedPrompt.includes("travel")) {
    return {
      message:
        "Night travel looks best with darker anchors, a practical layer, and footwear that can handle long movement. I leaned into a calm, elevated palette.",
      recommendations: buildRecommendations("navy-knit", "travel"),
    };
  }

  return {
    message: `I can help with prompts like ${promptSuggestions
      .map((entry) => `"${entry}"`)
      .join(", ")}.`,
    recommendations: buildRecommendations(),
  };
}
