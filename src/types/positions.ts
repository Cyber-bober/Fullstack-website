// src/types/positions.ts

export type PositionKey =
  | "goalkeeper"
  | "defender_center"
  | "defender_left"
  | "defender_right"
  | "midfielder_center"
  | "midfielder_left"
  | "midfielder_right"
  | "forward_center"
  | "forward_left"
  | "forward_right"
  | "substitute"
  | "coach"
  | "other";

export const positionLabels: Record<PositionKey, string> = {
  goalkeeper: "Вратарь",
  defender_center: "Защитник (центр)",
  defender_left: "Защитник (левый)",
  defender_right: "Защитник (правый)",
  midfielder_center: "Полузащитник (центр)",
  midfielder_left: "Полузащитник (левый)",
  midfielder_right: "Полузащитник (правый)",
  forward_center: "Нападающий (центр)",
  forward_left: "Нападающий (левый)",
  forward_right: "Нападающий (правый)",
  substitute: "Запасной",
  coach: "Тренер",
  other: "Другое",
};