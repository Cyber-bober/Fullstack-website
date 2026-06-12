//src/app/profile/page.tsx

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { team: true },
  });

  if (!user) redirect("/");

  // Если username начинается с oauth_ — перенаправляем на выбор ника
  if (user.username.startsWith("oauth_")) {
    redirect("/auth/choose-username");
  }

  return <ProfileClient user={user} isOwnProfile={true} />;
}