"use client";

import io from "socket.io-client";

// Conectar al servidor Socket.IO en el puerto 3000
export const socket = io(
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000"
); // Asegúrate de que tu servidor esté corriendo en este puerto
