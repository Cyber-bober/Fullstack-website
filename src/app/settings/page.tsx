//src/app/settings/page.tsx

"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";

export default function SettingsPage() {
  const [theme, setTheme] = useState("light");

  return (
    <div className="container">
      <h1 className="home-title">Настройки</h1>
      <Card>
        <div className="form-group">
          <label>Тема</label>
          <select
            value={theme}
            onChange={(e) => {
              setTheme(e.target.value);
              document.documentElement.className = e.target.value;
            }}
          >
            <option value="light">Светлая тема</option>
            <option value="dark">Тёмная тема</option>
          </select>
        </div>
      </Card>
    </div>
  );
}