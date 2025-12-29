"use client";

import { io } from "socket.io-client";

// Conectar al servidor Socket.IO (backend en puerto 3001)
export const socket = io(
  process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001"
);
