import { AppShell } from "@/components/app-shell";
import { ChatStylist } from "@/components/chat-stylist";

export default function ChatPage() {
  return (
    <AppShell
      eyebrow="AI stylist chat"
      title="Ask for a fit the same way you would text a stylist"
      description="Prompt the assistant with occasions, colors, or specific wardrobe items and receive wardrobe-aware outfit suggestions with clear reasoning."
    >
      <ChatStylist />
    </AppShell>
  );
}
