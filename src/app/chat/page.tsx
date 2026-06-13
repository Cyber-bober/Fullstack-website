//src/app/chat/page.tsx

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
      } catch (err) {
        console.error("Ошибка загрузки сессии:", err);
      }
      await loadConversations();
    };
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Ошибка загрузки диалогов:", err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Ошибка поиска:", err);
    }
  };

  const selectUser = async (user: ChatUser) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
    await loadMessages(user.id);
  };

  const loadMessages = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/messages?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Ошибка загрузки сообщений:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          text: newMessage,
        }),
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-page">
      <h1 className="home-title">Чат</h1>

      <div className="chat-layout">
        {/* Левая панель: поиск и диалоги */}
          {/* Поиск */}
          <div className="chat-search glass-effect">
            <input
              type="text"
              placeholder="Поиск по имени, username или ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="search-result-item"
                    onClick={() => selectUser(user)}
                  >
                    <div className="search-result-avatar">
                      {user.photos[0] && <img src={user.photos[0]} alt="" />}
                    </div>
                    <div>
                      <div className="search-result-name">{user.fullName}</div>
                      <div className="search-result-username">@{user.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Список диалогов */}
          <div className="conversations-list glass-effect">
            {conversations.length === 0 ? (
              <p className="empty-text">Нет диалогов</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.user.id}
                  className={`conversation-item ${
                    selectedUser?.id === conv.user.id ? "active" : ""
                  }`}
                  onClick={() => selectUser(conv.user)}
                >
                  <div className="conversation-row">
                    <div className="conversation-avatar">
                      {conv.user.photos[0] && (
                        <img src={conv.user.photos[0]} alt="" />
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-name">{conv.user.fullName}</div>
                      <div className="conversation-last-message">
                        {conv.lastMessage.text}
                      </div>
                    </div>
                    <div className="conversation-time">
                      {formatTime(conv.lastMessage.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        {/* Правая панель: переписка */}
        <Card className="chat-main glass-effect">
          {selectedUser ? (
            <>
              {/* Заголовок диалога */}
              <div className="chat-header">
                <div className="chat-header-avatar">
                  {selectedUser.photos[0] && (
                    <img src={selectedUser.photos[0]} alt="" />
                  )}
                </div>
                <div>
                  <div className="chat-header-name">{selectedUser.fullName}</div>
                  <div className="chat-header-username">@{selectedUser.username}</div>
                </div>
              </div>

              {/* Сообщения */}
              <div className="chat-messages">
                {loading ? (
                  <p className="empty-text">Загрузка...</p>
                ) : messages.length === 0 ? (
                  <p className="empty-text">Начните диалог</p>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`chat-message ${isOwn ? "own" : "other"}`}
                      >
                        <div className="chat-message-bubble">
                          <div>{msg.text}</div>
                          <div className="chat-message-time">
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Ввод сообщения */}
              <form className="chat-input-form" onSubmit={sendMessage}>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary chat-send-btn"
                  disabled={!newMessage.trim()}
                >
                  ➤
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              <p className="empty-text">Выберите пользователя для начала диалога</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}