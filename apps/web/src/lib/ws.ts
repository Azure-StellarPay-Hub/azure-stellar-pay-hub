'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL, getToken } from './api';

/** Connect to the realtime gateway and subscribe to live events. */
export function useRealtime(onEvent: (event: string, payload: unknown) => void): void {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    const token = getToken();
    if (!token) {
      return;
    }
    const socket: Socket = io(`${API_URL}/realtime`, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
    const onNotification = (payload: unknown) => callbackRef.current('notification', payload);
    const onTx = (payload: unknown) => callbackRef.current('transaction.updated', payload);
    socket.on('notification', onNotification);
    socket.on('transaction.updated', onTx);
    return () => {
      socket.off('notification', onNotification);
      socket.off('transaction.updated', onTx);
      socket.disconnect();
    };
  }, [getToken]);
}
