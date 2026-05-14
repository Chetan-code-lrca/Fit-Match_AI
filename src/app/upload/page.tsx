import { AppShell } from "@/components/app-shell";
import { UploadStudio } from "@/components/upload-studio";

export default function UploadPage() {
  return (
    <AppShell
      eyebrow="Wardrobe ingestion"
      title="Upload your closet, one outfit or item at a time"
      description="Support mirror selfies, flat lays, and individual clothing images while preparing metadata for cloud storage and recommendation workflows."
    >
      <UploadStudio />
    </AppShell>
  );
}
