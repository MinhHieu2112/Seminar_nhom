'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';

export function useAnalyticsSocket(onDashboardUpdate?: () => void) {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onDashboardUpdate);

  // Keep callbackRef updated without triggering useEffect re-runs
  useEffect(() => {
    callbackRef.current = onDashboardUpdate;
  }, [onDashboardUpdate]);

  useEffect(() => {
    if (!user?.id) return;

    const socketUrl = process.env.NEXT_PUBLIC_ANALYTICS_WS_URL || 'http://localhost:8003/analytics';
    const socket: Socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on(`dashboard-update-${user.id}`, () => {
      if (callbackRef.current) {
        callbackRef.current();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]); // Only re-run when user.id changes!

  return { isConnected };
}
