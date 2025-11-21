// src/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("sivec_token");

    if (!token) {
      console.log("⚠️ No hay token, no conectar socket");
      return;
    }

    console.log("🔌 Conectando WebSocket...");

    const newSocket = io("http://localhost:3000", {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ WebSocket conectado");
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ WebSocket desconectado:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔴 Error de conexión WebSocket:", error.message);
    });

    newSocket.on("factura:guia_asignada", (data) => {
      console.log("📨 factura:guia_asignada", data);
    });

    newSocket.on("viaje:estado_actualizado", (data) => {
      console.log("📨 viaje:estado_actualizado", data);
    });

    newSocket.on("guia:estado_actualizado", (data) => {
      console.log("📨 guia:estado_actualizado", data);
    });

    newSocket.on("viaje:progreso_actualizado", (data) => {
      console.log("📨 viaje:progreso_actualizado", data);
    });

    newSocket.on("viaje:completado", (data) => {
      console.log("📨 viaje:completado", data);
    });

    setSocket(newSocket);

    return () => {
      console.log("🧹 Limpiando WebSocket");
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
