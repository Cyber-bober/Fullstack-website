'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';

export default function ChatPage() {
  const { userId } = useParams();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [userName, setUserName] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      fetch(`/api/chat?userId=${userId}`)
        .then((r) => r.json())
        .then((d) => {
          setMessages(d.messages || []);
          setUserName(d.userName || '');
        });
    }
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: userId, text }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setText('');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2>Чат с {userName}</h2>
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, height: 400, overflowY: 'auto', marginBottom: 16 }}>
        {messages.map((m: any) => (
          <div
            key={m.id}
            style={{
              padding: 8,
              margin: '4px 0',
              borderRadius: 8,
              background: m.senderId === (session?.user as any)?.id ? '#0070f3' : '#f0f0f0',
              color: m.senderId === (session?.user as any)?.id ? '#fff' : '#000',
              alignSelf: m.senderId === (session?.user as any)?.id ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
              marginLeft: m.senderId === (session?.user as any)?.id ? 'auto' : 0,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>{m.senderName}</div>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Сообщение..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <button onClick={handleSend} style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Отправить
        </button>
      </div>
    </div>
  );
}
