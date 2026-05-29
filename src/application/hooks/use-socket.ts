"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/application/contexts/auth-context";

const getSocketUrl = () => {
  const configuredApiBase = process.env.NEXT_PUBLIC_API_URL;
  if (configuredApiBase && !configuredApiBase.includes("localhost:3000")) {
    try {
      const url = new URL(configuredApiBase);
      return `${url.protocol}//${url.host}/notifications`;
    } catch {
      return "http://localhost:3001/notifications";
    }
  }
  return "http://localhost:3001/notifications";
};

export function useSocket() {
  const { token, provider } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if the user is logged in
    if (!token || !provider?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = getSocketUrl();
    console.log(`[Socket] Connecting to ${socketUrl}...`);

    const client = io(socketUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = client;
    setSocket(client);

    client.on("connect", () => {
      console.log(`[Socket] Connected successfully: ${client.id}`);
      setIsConnected(true);

      // Join the notifications room for this provider
      client.emit("join_notifications", {}, (response: any) => {
        console.log("[Socket] Joined notifications channel:", response);
      });
    });

    client.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    client.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
    });

    return () => {
      console.log("[Socket] Cleaning up connection...");
      client.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, provider?.id]);

  return { socket, isConnected };
}
