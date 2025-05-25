import { ProfileLayout } from "@/components/app/profile/ProfileLayout";
import { HydrateClient } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Profile Page",
};

export default function ProfilePage() {
  return (
    <HydrateClient>
      <ProfileLayout />
    </HydrateClient>
  );
}
