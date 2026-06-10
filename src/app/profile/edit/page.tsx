// src/app/profile/edit/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    city: "",
    position: "",
    contacts: "",
    stats: "",
    birthDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) router.push("/profile"); // Возврат на профиль после успеха
      else alert("Ошибка сохранения");
    } catch {
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Card className="p-6 space-y-4">
        <h1 className="text-xl font-bold">Редактирование профиля</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          {Object.entries(formData).map(([key, value]) => (
            <input
              key={key}
              type={key === "birthDate" ? "date" : "text"}
              placeholder={key}
              value={value}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              className="w-full p-2 border rounded"
            />
          ))}
          <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            {loading ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      </Card>
    </div>
  );
}