"use client";

import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function AppLayout({
  children,
  name,
  email,
  image,
}: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="w-full">
        <div className="flex min-h-screen">
          <AppSidebar name={name} image={image} email={email} />
          <main className="flex-1 overflow-y-auto p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
