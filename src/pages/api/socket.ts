// src/pages/api/socket.ts
import type { NextApiRequest } from "next";
import { getSocketIo, NextApiResponseWithSocket } from "@/lib/socket";

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    getSocketIo(res);
  }
  res.end();
}