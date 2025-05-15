"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  FileSpreadsheet,
  Truck,
  Puzzle,
  History,
  Facebook,
  MessageCircle,
} from "lucide-react";
import { UserMenu } from "@/components/app/UserMenu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AppSidebar({ name, email, image }: UserMenuProps) {
  const pathname = usePathname();

  const isActiveRoute = (route: string) => {
    if (route === "/dashboard") {
      return pathname === route;
    }
    if (route === "/emails") {
      return (
        pathname === "/emails" ||
        (pathname.startsWith("/emails") &&
          !pathname.startsWith("/emails/history"))
      );
    }
    return pathname.startsWith(route);
  };

  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          {open ? (
            <Link href="/dashboard" className="text-xl font-bold">
              CRM
            </Link>
          ) : (
            <Link href="/dashboard" className="text-xs font-bold">
              CRM
            </Link>
          )}
        </div>
      </SidebarHeader>
      <Separator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Dashboard"
                  className={cn({
                    "bg-primary/90 text-background px-2 py-1 rounded-lg hover:bg-primary/90 hover:text-background":
                      isActiveRoute("/dashboard"),
                  })}
                >
                  <Link href="/dashboard">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Leads */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Leads"
                  className={cn({
                    "bg-primary/90 text-background px-2 py-1 rounded-lg hover:bg-primary/90 hover:text-background":
                      isActiveRoute("/leads"),
                  })}
                >
                  <Link href="/leads">
                    <Users />
                    <span>Leads</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Emails */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Emails"
                  className={cn({
                    "bg-primary/90 text-background px-2 py-1 rounded-lg hover:bg-primary/90 hover:text-background":
                      isActiveRoute("/emails"),
                  })}
                >
                  <Link href="/emails">
                    <Mail />
                    <span>Emails</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Emails */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Email History"
                  className={cn({
                    "bg-primary/90 text-background px-2 py-1 rounded-lg hover:bg-primary/90 hover:text-background":
                      isActiveRoute("/emails/history"),
                  })}
                >
                  <Link href="/emails/history">
                    <History />
                    <span>Email History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Stock */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Stock"
                  className={cn({
                    "bg-primary/90 text-background px-2 py-1 rounded-lg hover:bg-primary/90 hover:text-background":
                      isActiveRoute("/car-stock"),
                  })}
                >
                  <Link href="/car-stock">
                    <Truck />
                    <span>Stock</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Bot Docs */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Bot Docs"
                  className={cn({
                    "bg-primary/90 text-background px-2 py-1 rounded-lg hover:bg-primary/90 hover:text-background":
                      isActiveRoute("/bot-docs"),
                  })}
                >
                  <Link href="/bot-docs">
                    <FileSpreadsheet />
                    <span>Bot Docs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Playground */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Playground"
                  className={cn({
                    "bg-primary/90 text-background px-2 py-1 rounded-lg hover:bg-primary/90 hover:text-background":
                      isActiveRoute("/playground"),
                  })}
                >
                  <Link href="/playground">
                    <Puzzle />
                    <span>Playground</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Facebook"
                  className={cn({
                    "bg-primary/90 text-background px-2 py-1 rounded-lg hover:bg-primary/90 hover:text-background":
                      isActiveRoute("/settings/facebook-integration"),
                  })}
                >
                  <Link href="/settings/facebook-integration">
                    <Facebook />
                    <span>Facebook Integration</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="WhatsApp"
                  className={cn({
                    "bg-primary/90 text-background px-2 py-1 rounded-lg hover:bg-primary/90 hover:text-background":
                      isActiveRoute("/settings/whatsapp-integration"),
                  })}
                >
                  <Link href="/settings/whatsapp-integration">
                    <MessageCircle />
                    <span>WhatsApp Integration</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          {open && (
            <SidebarGroupLabel className="px-2">Account</SidebarGroupLabel>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <UserMenu name={name} email={email} image={image} />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
