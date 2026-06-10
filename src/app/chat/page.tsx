"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMessages([...messages, { text, sender: "Я" }]);
    setText("");
  };

  return (
    <div className="container">
      <h1 className="home-title">Чат</h1>
      <Card>
        <div style={{ height: "400px", overflowY: "auto", marginBottom: "1rem", padding: "0.5rem", border: "1px solid #ddd", borderRadius: "8px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: "0.5rem" }}>
              <strong>{m.sender}:</strong> {m.text}
            </div>
          ))}
        </div>
        <div className="flex" style={{ gap: "0.5rem" }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            style={{ flex: 1 }}
          />
          <button onClick={send} className="btn btn-primary">➤</button>
        </div>
      </Card>
    </div>
  );
}