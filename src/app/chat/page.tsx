"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChatUser, ChatMessage, Conversation } from "@/types/chat";

const PAGE_SIZE = 20;

export default function ChatPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setCurrentUserId(session?.user?.id);
        }
      } catch {}
      await loadConversations();
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length === 0 ? null : messages[0]?.id]);

  // Infinite Scroll
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore || loading) return;
    if (container.scrollTop === 0) {
      prevScrollHeightRef.current = container.scrollHeight;
      loadMoreMessages();
    }
  }, [hasMore, loading, selectedUser, page]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Read Receipts
  useEffect(() => {
    if (!selectedUser || !currentUserId) return;
    fetch("/api/chat/messages/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: selectedUser.id }),
    });
  }, [selectedUser, currentUserId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = searchQuery.trim();
      if (trimmed.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
          if (res.ok) setSearchResults(await res.json());
        } catch { setSearchResults([]); }
      } else {
        setIsSearching(false);
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) setConversations(await res.json());
    } catch {}
  };

  const selectUser = async (user: ChatUser) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setPage(0);
    setHasMore(true);
    await loadMessages(user.id, 0);
  };

  const loadMessages = async (userId: string, pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/messages?userId=${userId}&page=${pageNum}&limit=${PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 0) {
          setMessages(data.messages || data);
        } else {
          setMessages((prev) => [...(data.messages || data), ...prev]);
        }
        setHasMore(data.hasMore ?? (Array.isArray(data) ? data.length === PAGE_SIZE : false));
      }
    } catch {} finally { setLoading(false); }
  };

  const loadMoreMessages = async () => {
    if (!selectedUser || !hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadMessages(selectedUser.id, nextPage);
    // Восстановить позицию скролла
    setTimeout(() => {
      if (messagesContainerRef.current) {
        const newScrollHeight = messagesContainerRef.current.scrollHeight;
        messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      }
    }, 50);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedUser.id, text: newMessage }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
        await loadConversations();
      }
    } catch {}
  };

  const formatTime = (dateStr: string | undefined | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-page">
      <div className="chat-layout">
        <div className="chat-left">
          <div className="chat-search glass-effect">
            <input type="text" className="search-input" placeholder="Поиск..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" />
          </div>
          <div className="chat-list-wrapper glass-effect">
            {isSearching && searchResults.length > 0 ? (
              <div className="search-results-list">
                <div className="section-label">Найдено:</div>
                {searchResults.map((user) => (
                  <div key={user.id} className="conversation-item hoverable" onClick={() => selectUser(user)}>
                    <div className="conversation-avatar">{user.photos?.[0] ? <img src={user.photos[0]} /> : <div className="avatar-placeholder">{user.fullName?.[0]}</div>}</div>
                    <div className="conversation-info"><div className="conversation-name">{user.fullName}</div><div className="conversation-username">@{user.username}</div></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="conversations-list">
                {conversations.length === 0 ? <p className="empty-text">Нет диалогов</p> : conversations.map((conv) => (
                  <div key={conv.user.id} className={`conversation-item ${selectedUser?.id === conv.user.id ? "active" : ""}`} onClick={() => selectUser(conv.user)}>
                    <div className="conversation-avatar">{conv.user.photos?.[0] ? <img src={conv.user.photos[0]} /> : <div className="avatar-placeholder">{conv.user.fullName?.[0]}</div>}</div>
                    <div className="conversation-info"><div className="conversation-name">{conv.user.fullName}</div><div className="conversation-last-message">{conv.lastMessage?.text || "Нет сообщений"}</div></div>
                    <div className="conversation-time">{formatTime(conv.lastMessage?.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="chat-right">
          {selectedUser ? (
            <>
              <div className="chat-header glass-effect">
                <div className="chat-header-avatar">{selectedUser.photos?.[0] ? <img src={selectedUser.photos[0]} /> : <div className="avatar-placeholder">{selectedUser.fullName?.[0]}</div>}</div>
                <div><div className="chat-header-name">{selectedUser.fullName}</div><div className="chat-header-username">@{selectedUser.username}</div></div>
              </div>
              <div className="chat-messages glass-effect" ref={messagesContainerRef}>
                {loading && page === 0 ? <p className="empty-text">Загрузка...</p> :
                 messages.length === 0 ? <p className="empty-text">Начните диалог!</p> :
                 messages.map((msg) => {
                  const isOwn = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`chat-message ${isOwn ? "own" : "other"}`}>
                      <div className="chat-message-bubble"><div>{msg.text}</div><div className="chat-message-time">{formatTime(msg.createdAt)}</div></div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form className="chat-input-form" onSubmit={sendMessage}>
                <input type="text" className="chat-input glass-effect" placeholder="Сообщение..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <button type="submit" className="btn btn-primary glass-effect chat-send-btn" disabled={!newMessage.trim()}>→</button>
              </form>
            </>
          ) : (
            <div className="chat-empty"><p className="empty-text">Выберите собеседника</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
