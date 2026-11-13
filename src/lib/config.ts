export const integrationStatus = {
  supabase:
    Boolean(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  openAi: Boolean(process.env.OPENAI_API_KEY),
  weather: Boolean(process.env.WEATHER_API_KEY),
};
