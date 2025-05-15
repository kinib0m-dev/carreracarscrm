import { auth } from "@/auth";
import AppLayout from "@/components/app/AppLayout";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <AppLayout
      name={session.user.name}
      email={session.user.email}
      image={session.user.image}
    >
      {children}
    </AppLayout>
  );
}
