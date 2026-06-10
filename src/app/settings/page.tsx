"use client";
import { useState } from "react";

export default function SettingsPage() {
  const [theme, setTheme] = useState("light");
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Настройки</h1>
      <select value={theme} onChange={e => { setTheme(e.target.value); document.documentElement.className = e.target.value; }} className="p-2 border rounded">
        <option value="light">Светлая тема</option>
        <option value="dark">Тёмная тема</option>
      </select>
    </div>
  );
}
