/**
 * WebSocket hook for Orchestrator real-time updates
 * WO-WEBSOCKET-REALTIME-UPDATES-001
 */

import { useState, useEffect, useRef } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';

export interface WebSocketEvent {
  type: string;
  file_path?: string;
  project_path?: string;
  feature_name?: string;
  timestamp?: string;
}

export interface WebSocketCallbacks {
  onPlanAdded?: (event: WebSocketEvent) => void;
  onPlanUpdated?: (event: WebSocketEvent) => void;
  onPlanDeleted?: (event: WebSocketEvent) => void;
  onStubAdded?: (event: WebSocketEvent) => void;
  onStubUpdated?: (event: WebSocketEvent) => void;
  onStubDeleted?: (event: WebSocketEvent) => void;
  onWorkorderAdded?: (event: WebSocketEvent) => void;
  onProjectAdded?: (event: WebSocketEvent) => void;
  onProjectRemoved?: (event: WebSocketEvent) => void;
}

export function useOrchestratorWebSocket(callbacks: WebSocketCallbacks = {}) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;

    const connect = () => {
      if (isUnmountedRef.current) return;

      try {
        // Get backend URL from window (set by electron) or use default
        const backendUrl = (window as any).BACKEND_URL || 'http://localhost:8000';
        const wsUrl = backendUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/orchestrator/ws';

        setStatus('connecting');
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmountedRef.current) return;

          console.log('[WebSocket] Connected to orchestrator');
          setStatus('connected');
          reconnectAttemptsRef.current = 0; // Reset on successful connection
        };

        ws.onmessage = (event) => {
          if (isUnmountedRef.current) return;

          try {
            const data: WebSocketEvent = JSON.parse(event.data);

            // Handle ping/pong heartbeat
            if (data.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong' }));
              return;
            }

            // Fire appropriate callback based on event type
            switch (data.type) {
              case 'plan_added':
                callbacks.onPlanAdded?.(data);
                break;
              case 'plan_updated':
                callbacks.onPlanUpdated?.(data);
                break;
              case 'plan_deleted':
                callbacks.onPlanDeleted?.(data);
                break;
              case 'stub_added':
                callbacks.onStubAdded?.(data);
                break;
              case 'stub_updated':
                callbacks.onStubUpdated?.(data);
                break;
              case 'stub_deleted':
                callbacks.onStubDeleted?.(data);
                break;
              case 'workorder_added':
                callbacks.onWorkorderAdded?.(data);
                break;
              case 'project_added':
                callbacks.onProjectAdded?.(data);
                break;
              case 'project_removed':
                callbacks.onProjectRemoved?.(data);
                break;
              default:
                console.log('[WebSocket] Unknown event type:', data.type);
            }
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
        };

        ws.onclose = () => {
          if (isUnmountedRef.current) return;

          console.log('[WebSocket] Disconnected');
          setStatus('disconnected');
          wsRef.current = null;

          // Attempt reconnect with exponential backoff
          const backoffDelays = [1000, 2000, 4000, 8000, 16000, 30000]; // 1s, 2s, 4s, 8s, 16s, 30s max
          const delay = backoffDelays[Math.min(reconnectAttemptsRef.current, backoffDelays.length - 1)];

          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) {
              connect();
            }
          }, delay);
        };
      } catch (error) {
        console.error('[WebSocket] Failed to establish connection:', error);
        setStatus('disconnected');
      }
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      isUnmountedRef.current = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  return {
    status,
    connected: status === 'connected'
  };
}
