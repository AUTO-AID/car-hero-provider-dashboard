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
        queueMicrotask(() => {
          setSocket(null);
          setIsConnected(false);
        });
      }
      return;
    }

    const socketUrl = getSocketUrl();
    debugSocket(`[Socket] Connecting to ${socketUrl}...`);

    const client = io(socketUrl, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = client;
    queueMicrotask(() => setSocket(client));

    client.on("connect", () => {
      debugSocket(`[Socket] Connected successfully: ${client.id}`);
      setIsConnected(true);

      client.emit("join_notifications", {}, (response: JoinNotificationsResponse) => {
        debugSocket("[Socket] Joined notifications channel:", response);
      });
    });

    client.on("disconnect", (reason) => {
      debugSocket(`[Socket] Disconnected: ${reason}`);
      setIsConnected(false);
    });

    client.on("connect_error", (error) => {
      debugSocket("[Socket] Connection error:", error);
    });

    return () => {
      debugSocket("[Socket] Cleaning up connection...");
      client.disconnect();
      socketRef.current = null;
      queueMicrotask(() => {
        setSocket(null);
        setIsConnected(false);
      });
    };
  }, [token, provider?.id]);

  return { socket, isConnected };
}

interface JoinNotificationsResponse {
  success?: boolean;
  room?: string;
}

function debugSocket(message: string, payload?: unknown) {
  if (process.env.NODE_ENV === "development") {
    if (payload === undefined) console.info(message);
    else console.info(message, payload);
  }
}
