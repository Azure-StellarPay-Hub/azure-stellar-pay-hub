/**
 * WebSocket notification client for the background service worker.
 * Connects to the API's Socket.IO endpoint and forwards payment events
 * to Chrome notifications and the popup via chrome.runtime messaging.
 */

import { getApiUrl, getToken } from './api';

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;

export function connect(): void {
  disconnect();

  getToken()
    .then((token) => {
      if (!token) return;

      getApiUrl()
        .then((apiUrl) => {
          const wsUrl =
            apiUrl.replace(/^http/, 'ws') + '/socket.io/?token=' + encodeURIComponent(token);

          try {
            socket = new WebSocket(wsUrl);
          } catch {
            console.warn('[StellarPay] WebSocket creation failed — retrying later');
            scheduleReconnect();
            return;
          }

          socket.onopen = () => {
            console.log('[StellarPay] WebSocket connected');
            reconnectDelay = 1000;
          };

          socket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data as string);
              handleEvent(data);
            } catch {
              // ignore malformed messages
            }
          };

          socket.onclose = () => {
            console.log('[StellarPay] WebSocket disconnected — reconnecting...');
            scheduleReconnect();
          };

          socket.onerror = () => {
            // Silently close; onclose will trigger reconnect
            socket?.close();
          };
        })
        .catch(() => {
          scheduleReconnect();
        });
    })
    .catch(() => {
      scheduleReconnect();
    });
}

export function disconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.onclose = null;
    socket.close();
    socket = null;
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    connect();
  }, reconnectDelay);
}

interface WsEvent {
  type: string;
  txId?: string;
  amount?: string;
  asset?: string;
  sender?: string;
  recipient?: string;
  reason?: string;
}

function handleEvent(event: WsEvent): void {
  switch (event.type) {
    case 'payment.received':
      showNotification(
        'Payment Received',
        `${event.amount ?? ''} ${event.asset ?? 'XLM'} from ${shortKey(event.sender ?? '')}`,
      );
      break;
    case 'payment.sent':
      showNotification(
        'Payment Sent',
        `${event.amount ?? ''} ${event.asset ?? 'XLM'} to ${shortKey(event.recipient ?? '')}`,
      );
      break;
    case 'payment.failed':
      showNotification('Payment Failed', event.reason ?? 'Transaction failed on the network');
      break;
    default:
      break;
  }
}

function showNotification(title: string, message: string): void {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 2,
  });
}

function shortKey(key: string): string {
  if (key.length <= 12) return key;
  return key.slice(0, 6) + '…' + key.slice(-4);
}
