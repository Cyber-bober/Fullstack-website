'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import EmojiPicker from 'emoji-picker-react';

export default function ChatPage() {
  const { userId } = useParams();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [userName, setUserName] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('receiverId', userId as string);
    const res = await fetch('/api/chat/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
    }
  };

  const handleEmojiClick = (emoji: any) => {
    setText((prev) => prev + emoji.emoji);
    setShowEmoji(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2>Чат с {userName}</h2>

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, height: 400, overflowY: 'auto', marginBottom: 16, background: 'var(--card-bg)' }}>
        {messages.map((m: any) => (
          <div
            key={m.id}
            style={{
              padding: 8,
              margin: '4px 0',
              borderRadius: 8,
              background: m.senderId === (session?.user as any)?.id ? '#0070f3' : '#f0f0f0',
              color: m.senderId === (session?.user as any)?.id ? '#fff' : '#000',
              maxWidth: '70%',
              marginLeft: m.senderId === (session?.user as any)?.id ? 'auto' : 0,
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>{m.senderName}</div>
            {m.fileUrl ? (
              <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                📎 {m.text}
              </a>
            ) : (
              m.text
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {showEmoji && (
        <div style={{ position: 'absolute', bottom: 80 }}>
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setShowEmoji(!showEmoji)} style={{ padding: '8px 12px', cursor: 'pointer', background: 'none', border: '1px solid #ddd', borderRadius: 8 }}>
          🙂
        </button>
        <button onClick={() => fileRef.current?.click()} style={{ padding: '8px 12px', cursor: 'pointer', background: 'none', border: '1px solid #ddd', borderRadius: 8 }}>
          📎
        </button>
        <input type="file" ref={fileRef} onChange={handleFileUpload} style={{ display: 'none' }} />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Сообщение..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
        />
        <button onClick={handleSend} style={{ padding: '10px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          ➤
        </button>
      </div>
    </div>
  );
}
