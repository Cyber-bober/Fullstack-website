// src/app/chat/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Card from "@/components/ui/Card";
import { ChatUser, ChatMessage, Conversation } from "@/types/chat";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          setCurrentUserId(session?.user?.id);
        }
      } catch (err) { console.error("Ошибка сессии:", err); }
      await loadConversations();
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedUser]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const trimmed = searchQuery.trim();
      
      if (trimmed.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`);
          if (res.ok) {
            const data = await res.json();
            setSearchResults(data);
          } else {
            setSearchResults([]);
          }
        } catch (err) {
          console.error("Ошибка поиска:", err);
          setSearchResults([]);
        }
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
    } catch (err) { console.error("Ошибка диалогов:", err); }
  };

  const selectUser = async (user: ChatUser) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    await loadMessages(user.id);
  };

  const loadMessages = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/messages?userId=${userId}`);
      if (res.ok) setMessages(await res.json());
    } catch (err) { console.error("Ошибка сообщений:", err); }
    finally { setLoading(false); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else {
        const error = await res.json();
        alert(error.error || "Ошибка отправки");
      }
    } catch (err) {
      console.error("Ошибка отправки:", err);
      alert("Ошибка сети");
    }
  };

  const formatTime = (dateStr: string | undefined | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("ru-RU", { 
      hour: "2-digit", minute: "2-digit" 
    });
  };

  return (
    <div className="chat-page">
      <div className="chat-layout">
        
        {/* ЛЕВАЯ ЧАСТЬ */}
        <div className="chat-left">
          <div className="chat-search glass-effect">
            <input
              type="text"
              className="search-input"
              placeholder="Поиск по имени или @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="chat-list-wrapper glass-effect">
            {isSearching && searchResults.length > 0 ? (
              <div className="search-results-list">
                <div className="section-label">Найдено пользователей:</div>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="conversation-item hoverable"
                    onClick={() => selectUser(user)}
                  >
                    <div className="conversation-avatar">
                      {user.photos?.[0] ? (
                        <img src={user.photos[0]} alt="" />
                      ) : (
                        <div className="avatar-placeholder">{user.fullName?.[0] || "?"}</div>
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-name">{user.fullName}</div>
                      <div className="conversation-username">@{user.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="conversations-list">
                {conversations.length === 0 ? (
                  <p className="empty-text">Нет активных диалогов</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.user.id}
                      className={`conversation-item ${
                        selectedUser?.id === conv.user.id ? "active" : ""
                      }`}
                      onClick={() => selectUser(conv.user)}
                    >
                      <div className="conversation-avatar">
                        {conv.user.photos?.[0] ? (
                          <img src={conv.user.photos[0]} alt="" />
                        ) : (
                          <div className="avatar-placeholder">{conv.user.fullName?.[0] || "?"}</div>
                        )}
                      </div>
                      <div className="conversation-info">
                        <div className="conversation-name">{conv.user.fullName}</div>
                        <div className="conversation-last-message">
                          {conv.lastMessage?.text || "Нет сообщений"}
                        </div>
                      </div>
                      <div className="conversation-time">
                        {formatTime(conv.lastMessage?.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ПРАВАЯ ЧАСТЬ */}
        <div className="chat-right">
          {selectedUser ? (
            <>
              <div className="chat-header glass-effect">
                <div className="chat-header-avatar">
                  {selectedUser.photos?.[0] ? (
                    <img src={selectedUser.photos[0]} alt="" />
                  ) : (
                    <div className="avatar-placeholder">{selectedUser.fullName?.[0] || "?"}</div>
                  )}
                </div>
                <div>
                  <div className="chat-header-name">{selectedUser.fullName}</div>
                  <div className="chat-header-username">@{selectedUser.username}</div>
                </div>
              </div>

              <div className="chat-messages glass-effect">
                {loading ? (
                  <p className="empty-text">Загрузка истории...</p>
                ) : messages.length === 0 ? (
                  <p className="empty-text">Начните диалог первым!</p>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} className={`chat-message ${isOwn ? "own" : "other"}`}>
                        <div className="chat-message-bubble">
                          <div>{msg.text}</div>
                          <div className="chat-message-time">{formatTime(msg.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  className="chat-input glass-effect"
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary chat-send-btn" disabled={!newMessage.trim()}><img src="/uploads/svg/send.svg" className="svg"/></button>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              <p className="empty-text">Выберите собеседника слева</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}