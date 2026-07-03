import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  
  // Редирект на /profile/[мой-id] — использует ту же страницу что и чужой профиль
  redirect(`/profile/${session.user.id}`);
}
