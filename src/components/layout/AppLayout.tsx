import { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { MobileNav } from "./MobileNav";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container py-6 pb-24 md:pb-6">{children}</main>
      <MobileNav />
    </div>
  );
}
