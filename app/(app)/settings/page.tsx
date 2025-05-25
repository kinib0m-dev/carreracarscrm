import { SettingsLayout } from "@/components/app/settings/SettingsLayout";
import { HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Settings Page",
};

export default function SettingsPage() {
  return (
    <HydrateClient>
      <SettingsLayout />
    </HydrateClient>
  );
}
