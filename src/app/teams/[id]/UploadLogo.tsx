"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function UploadLogo({ teamId, currentLogo }: { teamId: string; currentLogo: string | null }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logo, setLogo] = useState(currentLogo);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("logo", file);
    const res = await fetch(`/api/teams/${teamId}/photo`, { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      setLogo(data.logoUrl);
      router.refresh();
    }
  };

  return (
    <div>
      <button onClick={() => fileRef.current?.click()} className="btn btn-primary" style={{ fontSize: 12 }}>
        Загрузить логотип
      </button>
      <input type="file" accept="image/*" ref={fileRef} onChange={upload} hidden />
    </div>
  );
}
