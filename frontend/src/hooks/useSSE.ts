import { useEffect, useRef, useState } from 'react';
import { authManager } from '../utils/auth';

interface UseSSEOptions {
  onAlert?: (alert: any) => void;
  onAck?: (data: any) => void;
  onPing?: (data: any) => void;
  onConnected?: (data: any) => void;
  onError?: (error: Event) => void;
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      setError(null);

      // Vérifier si l'utilisateur est authentifié
      if (!authManager.isAuthenticated()) {
        setError('Authentification requise pour les notifications');
        return;
      }

      // Ajouter le token d'authentification à l'URL
      const token = authManager.getToken();
      const urlWithAuth = token ? `${url}?token=${encodeURIComponent(token)}` : url;

      const eventSource = new EventSource(urlWithAuth);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        console.log('SSE connected');
      };

      eventSource.onerror = (event) => {
        setIsConnected(false);
        console.error('SSE error:', event);

        if (options.onError) {
          options.onError(event);
        }

        // Tentative de reconnexion
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttempts.current++;
            console.log(`Reconnecting SSE (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        } else {
          setError('Impossible de se connecter aux notifications en temps réel');
        }
      };

      eventSource.addEventListener('alert', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (options.onAlert) {
            options.onAlert(data);
          }
        } catch (err) {
          console.error('Error parsing alert event:', err);
        }
      });

      eventSource.addEventListener('ack', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (options.onAck) {
            options.onAck(data);
          }
        } catch (err) {
          console.error('Error parsing ack event:', err);
        }
      });

      eventSource.addEventListener('ping', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (options.onPing) {
            options.onPing(data);
          }
        } catch (err) {
          console.error('Error parsing ping event:', err);
        }
      });

      eventSource.addEventListener('connected', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (options.onConnected) {
            options.onConnected(data);
          }
        } catch (err) {
          console.error('Error parsing connected event:', err);
        }
      });

    } catch (err) {
      console.error('Failed to create EventSource:', err);
      setError('Erreur lors de la création de la connexion SSE');
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    reconnectAttempts.current = 0;
  };

  useEffect(() => {
    // Ne pas se connecter si l'URL est vide
    if (url && url.trim() !== '') {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    isConnected,
    error,
    disconnect,
    reconnect: connect,
  };
}
