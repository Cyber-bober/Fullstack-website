'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserUsername: string;
  lastMessage: string;
  unreadCount: number;
}

export default function ChatListPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (search.length >= 2) {
      fetch(`/api/users/search?q=${search}`)
        .then((r) => r.json())
        .then((d) => setSearchResults(d.users || []));
    } else {
      setSearchResults([]);
    }
  }, [search]);

  useEffect(() => {
    fetch('/api/chat/conversations')
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []));
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>💬 Чат</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск пользователя..."
        style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 8, border: '1px solid #ddd' }}
      />

      {searchResults.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3>Результаты поиска</h3>
          {searchResults.map((u) => (
            <Link key={u.id} href={`/chat/${u.id}`}
              style={{ display: 'flex', padding: 8, borderBottom: '1px solid #eee', textDecoration: 'none', color: 'inherit' }}>
              <strong>@{u.username}</strong> — {u.fullName}
            </Link>
          ))}
        </div>
      )}

      <h3>Диалоги</h3>
      {conversations.length === 0 ? (
        <p style={{ color: '#666' }}>Нет активных диалогов. Найдите пользователя выше.</p>
      ) : (
        conversations.map((c) => (
          <Link key={c.otherUserId} href={`/chat/${c.otherUserId}`}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: 12,
              borderBottom: '1px solid #eee',
              textDecoration: 'none',
              color: 'inherit',
              background: c.unreadCount > 0 ? '#e3f2fd' : 'transparent',
            }}>
            <div>
              <strong>{c.otherUserName}</strong>
              <div style={{ color: '#666', fontSize: 14 }}>@{c.otherUserUsername}</div>
              <div style={{ fontSize: 13, color: '#999' }}>{c.lastMessage?.substring(0, 50)}</div>
            </div>
            {c.unreadCount > 0 && (
              <span style={{ background: '#0070f3', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>
                {c.unreadCount}
              </span>
            )}
          </Link>
        ))
      )}
    </div>
  );
}
