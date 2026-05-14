export const integrationStatus = {
  googleAuth:
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET),
  emailAuth: Boolean(process.env.AUTH_SECRET),
  cloudinary:
    Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET),
  openAi: Boolean(process.env.OPENAI_API_KEY),
  weather: Boolean(process.env.WEATHER_API_KEY),
};
