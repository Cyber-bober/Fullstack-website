// src/app/teams/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";

type Team = { 
  id: string; 
  name: string; 
  logoUrl?: string | null; 
  captain?: { fullName: string } | null; 
  _count?: { players: number }; 
};

export default function TeamsPage() {
  const router = useRouter();
  // ✅ ИСПРАВЛЕНИЕ: Добавлена проверка на null для searchParams
  const searchParams = useSearchParams() ?? new URLSearchParams();
  
  const [teamsData, setTeamsData] = useState<{ data: Team[]; meta: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [liveTeamQuery, setLiveTeamQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const page = searchParams.get("page") || "1";
        const q = searchParams.get("q") || "";
        setLiveTeamQuery(q);

        const [teamsRes, sessionRes] = await Promise.all([
          fetch(`/api/teams?page=${page}&limit=12&q=${encodeURIComponent(q)}`),
          fetch("/api/auth/session"),
        ]);

        if (teamsRes.ok) setTeamsData(await teamsRes.json());
        else setTeamsData({ data: [], meta: {} });

        if (sessionRes.ok) { const s = await sessionRes.json(); setUserRole(s?.user?.role || null); }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadData();
  }, [searchParams]);

  // Живой поиск команд
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get("q") || "";
      if (liveTeamQuery !== currentQ) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("q", liveTeamQuery);
        params.set("page", "1");
        router.push(`?${params.toString()}`);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [liveTeamQuery, searchParams, router]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/teams/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTeamName }) });
      if (res.ok) { setNewTeamName(""); setShowCreateForm(false); router.push("?page=1"); }
      else { const error = await res.json(); alert(error.error || "Ошибка создания команды"); }
    } catch { alert("Ошибка сети"); } finally { setCreating(false); }
  };

  if (loading) return <p className="empty-text">Загрузка...</p>;

  return (
    <div className="container">
      <div className="section-header">
        <h1 className="home-title" style={{ margin: 0 }}>Команды</h1>
        {userRole === "ADMIN" && <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>{showCreateForm ? "Отмена" : "+ Создать команду"}</button>}
      </div>

      {showCreateForm && (
        <Card className="form-card" style={{ marginBottom: "24px" }}>
          <form onSubmit={handleCreateTeam}>
            <div className="form-group"><label>Название команды</label><input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Введите название команды" required /></div>
            <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Создание..." : "Создать"}</button>
          </form>
        </Card>
      )}

      {/* Живой поиск без кнопки */}
      <div className="search-bar glass-effect">
        <input type="text" placeholder="Поиск команд (введите и подождите)..." value={liveTeamQuery} onChange={(e) => setLiveTeamQuery(e.target.value)} className="search-input" />
      </div>

      {!teamsData?.data || teamsData.data.length === 0 ? (
        <p className="empty-text">Команды не найдены</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {teamsData.data.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`} className="block" style={{ textDecoration: "none", color: "inherit" }}>
              <Card style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
                {/* ✅ ЛОГОТИП КОМАНДЫ */}
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '50%', 
                  background: '#f3f4f6', flexShrink: 0, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #e5e7eb'
                }}>
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#9ca3af' }}>
                      {team.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold text-lg" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{team.name}</div>
                  <div className="text-gray" style={{ fontSize: '13px' }}>Игроков: {team._count?.players || 0}</div>
                  {team.captain && <div className="text-gray" style={{ fontSize: "12px", marginTop: "4px", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Капитан: {team.captain.fullName}</div>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {teamsData?.meta && <Pagination currentPage={teamsData.meta.page} totalPages={teamsData.meta.totalPages} />}
    </div>
  );
}