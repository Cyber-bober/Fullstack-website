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
  rating?: number;
  globalIndex?: number;
};

export default function TeamsPage() {
  const router = useRouter();
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

        if (teamsRes.ok) {
          const data = await teamsRes.json();
          setTeamsData(data);
        }
        else setTeamsData({ data: [], meta: {} });

        if (sessionRes.ok) { const s = await sessionRes.json(); setUserRole(s?.user?.role || null); }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadData();
  }, [searchParams]);

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
      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="home-title" style={{ margin: 0 }}>Команды</h1>
        {userRole === "ADMIN" && <button className="btn btn-primary glass-effect" onClick={() => setShowCreateForm(!showCreateForm)}>{showCreateForm ? "Отмена" : "Создать команду"}</button>}
      </div>

      <div className="search-bar glass-effect" style={{ marginBottom: "24px" }}>
        <input type="text" placeholder="Поиск команд..." value={liveTeamQuery} onChange={(e) => setLiveTeamQuery(e.target.value)} className="search-input" />
      </div>

      {showCreateForm && (
        <Card className="form-card glass-effect" style={{ marginBottom: "24px" }}>
          <form onSubmit={handleCreateTeam}>
            <div className="form-group"><label style={{ color: '#ffffff' }}>Название команды</label><input type="text" className="glass-effect" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Введите название команды" required /></div>
            <button type="submit" className="btn btn-primary glass-effect" disabled={creating}>{creating ? "Создание..." : "Создать"}</button>
          </form>
        </Card>
      )}

      {!teamsData?.data || teamsData.data.length === 0 ? (
        <p className="empty-text">Команды не найдены</p>
      ) : (
        <Card className="glass-effect" style={{ padding: 0, overflow: "hidden", background: 'transparent', border: 'none', boxShadow: 'none' }}>
          <div className="teams-table">
            <div className="teams-table-header">
              <div className="table-col position">№</div>
              <div className="table-col team">Команда</div>
              <div className="table-col players">Игроков</div>
              <div className="table-col rating">Рейтинг</div>
            </div>

            {teamsData.data.map((team) => {
              const position = team.globalIndex || 0;

              return (
                <Link 
                  key={team.id} 
                  href={`/teams/${team.id}`}
                  className="teams-table-row glass-effect"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="table-col position">
                    {position <= 3 ? (
                      <span className={`medal medal-${position}`}>{position}</span>
                    ) : (
                      position
                    )}
                  </div>
                  <div className="table-col team">
                    <div className="team-logo-small">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#9ca3af' }}>
                          {team.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="team-name">{team.name}</span>
                  </div>
                  <div className="table-col players">{team._count?.players || 0}</div>
                  <div className="table-col rating">{team.rating || 0}</div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {teamsData?.meta && <Pagination currentPage={teamsData.meta.page} totalPages={teamsData.meta.totalPages} />}
    </div>
  );
}