// src/app/profile/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

export default function ProfilePage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${params.id}`);
        if (res.ok) {
          setUser(await res.json());
        } else {
          console.error("Профиль не найден");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [params.id]);

  if (loading) return <p className="p-4">Загрузка...</p>;
  if (!user) return <p className="p-4">Пользователь не найден</p>;

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Card className="text-center">
        <h1>{user.fullName}</h1>
        <p>@{user.username}</p>
      </Card>
    </div>
  );
}