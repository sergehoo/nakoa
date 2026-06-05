import { SidebarPremium } from "@/components/layout/sidebar-premium";
import { TopbarPremium } from "@/components/layout/topbar-premium";
import { AiAssistantDrawer } from "@/components/domain/ai-assistant-drawer";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <SidebarPremium role="customer" />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopbarPremium />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
      <AiAssistantDrawer />
    </div>
  );
}
