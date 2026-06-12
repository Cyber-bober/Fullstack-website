//src/app/profile/[id]/page.tsx

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileClient from "../ProfileClient";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/api/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { team: true },
  });

  if (!user) redirect("/");

  const isOwnProfile = params.id === session.user.id;
  
  return <ProfileClient user={user} isOwnProfile={isOwnProfile} />;
}