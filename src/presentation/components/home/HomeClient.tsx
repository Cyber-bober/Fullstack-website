'use client';

import Link from 'next/link';
import { useTheme } from '@/presentation/providers/ThemeProvider';

interface PostPlain {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  category: string;
  matchId?: string;
}

interface MatchPlain {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  status: string;
  score?: { home: number; away: number } | null;
  isLive: boolean;
  isFinished: boolean;
}

interface Props {
  posts: PostPlain[];
  matches: MatchPlain[];
}

export default function HomeClient({ posts, matches }: Props) {
  const { theme, t } = useTheme();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>{t('welcome')}</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid #ddd', paddingBottom: 12 }}>
        <a href="#news" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0070f3' }}>{t('news')}</a>
        <a href="#calendar" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0070f3' }}>{t('calendar')}</a>
        <a href="#live" style={{ fontWeight: 'bold', textDecoration: 'none', color: '#0070f3' }}>{t('live')}</a>
      </div>

      <section id="news">
        <h2>{t('news')}</h2>
        {posts.length === 0 ? (
          <p>{t('noNews')}</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} style={{
              border: '1px solid #eee',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
              background: theme === 'dark' ? '#2a2a2a' : '#fff',
            }}>
              <h3>{post.title}</h3>
              <p>{post.preview}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 14 }}>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <span>{post.category}</span>
              </div>
              {post.matchId && (
                <Link href={`/matches/${post.matchId}`} style={{ color: '#0070f3', fontSize: 14 }}>
                  {t('live')} →
                </Link>
              )}
            </div>
          ))
        )}
      </section>

      <section id="calendar" style={{ marginTop: 40 }}>
        <h2>{t('upcomingMatches')}</h2>
        {matches.length === 0 ? (
          <p>{t('noMatches')}</p>
        ) : (
          matches.map((match) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              style={{
                display: 'block',
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                textDecoration: 'none',
                color: 'inherit',
                background: theme === 'dark' ? '#2a2a2a' : '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{match.homeTeamId} vs {match.awayTeamId}</span>
                <span>{new Date(match.date).toLocaleDateString()}</span>
              </div>
              {match.score && (
                <div style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
                  {match.score.home} : {match.score.away}
                </div>
              )}
              <div style={{ fontSize: 12, color: match.isLive ? 'red' : match.isFinished ? 'green' : '#666' }}>
                {match.status}
              </div>
            </Link>
          ))
        )}
      </section>

      <section id="live" style={{ marginTop: 40 }}>
        <h2>{t('live')}</h2>
        <p>{t('noMatches')}</p>
      </section>
    </div>
  );
}
