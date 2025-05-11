
import { useEffect, useState, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // For development, if no real server, simulate a connection
    const isLocalDev = !url.startsWith('ws://') && !url.startsWith('wss://');
    
    if (isLocalDev) {
      // Simulate connection for demo purposes
      setIsConnected(true);
      return () => {
        setIsConnected(false);
      };
    }
    
    // Real WebSocket connection
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const sendMessage = useCallback((data: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    } else if (import.meta.env.DEV) {
      // In development mode, simulate the message coming back
      setTimeout(() => {
        setMessage(data);
      }, 100);
    }
  }, []);

  return { isConnected, message, sendMessage };
};
