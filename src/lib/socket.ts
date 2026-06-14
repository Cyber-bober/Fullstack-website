// src/lib/socket.ts
import { Server as NetServer } from "http";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

// Расширяем стандартный ответ Next.js, добавляя туда свойство io
export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

let io: SocketIOServer | undefined;

export const getSocketIo = (res: NextApiResponseWithSocket) => {
  if (!io) {
    // Явное приведение типа к any решает проблему несовместимости HttpServer и TServerInstance
    io = new SocketIOServer(res.socket.server as any, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*", // В продакшене замени на свой домен
        methods: ["GET", "POST"]
      }
    });
    
    console.log("⚡️ Socket.IO initialized");

    io.on("connection", (socket) => {
      console.log("🔌 Клиент подключился:", socket.id);

      // Пользователь входит в комнату конкретного тикета
      socket.on("join_support", (ticketId: string) => {
        socket.join(`ticket_${ticketId}`);
        console.log(`User ${socket.id} joined ticket_${ticketId}`);
      });

      // Отправка сообщения в комнату
      socket.on("send_message", (data) => {
        // Отправляем всем в комнате, кроме отправителя
        socket.to(`ticket_${data.ticketId}`).emit("receive_message", data);
      });

      socket.on("disconnect", () => {
        console.log("Клиент отключился:", socket.id);
      });
    });
  }
  
  // Сохраняем инстанс в ответе, чтобы не создавать новый при каждом запросе
  res.socket.server.io = io;
  return io;
};