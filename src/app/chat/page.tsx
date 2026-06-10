"use client";
import { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>([]);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMessages([...messages, { text, sender: "Я" }]);
    setText("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Чат</h1>
      <div className="h-64 overflow-y-auto border rounded p-2 mb-2">
        {messages.map((m, i) => (
          <div key={i} className="mb-1"><b>{m.sender}:</b> {m.text}</div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} className="flex-1 p-2 border rounded" />
        <button onClick={send} className="bg-blue-600 text-white px-4 rounded">➤</button>
      </div>
    </div>
  );
}
