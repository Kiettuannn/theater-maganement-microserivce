import { useEffect, useRef } from 'react';
import { socketService } from '@/services/socketService';
import { useAuthStore, selectToken } from '@/stores';

/**
 * useSocket - Custom hook for managing Socket.IO connection
 * Automatically connects when token is available and disconnects on unmount
 * 
 * @param url - Socket.IO server URL (default: http://localhost:9092)
 * @returns Object with socket service methods
 */
export function useSocket(url?: string) {
  const token = useAuthStore(selectToken);
  const isConnectedRef = useRef(false);

  const socketUrl = url || import.meta.env.VITE_SOCKET_URL || 
    (import.meta.env.PROD ? window.location.origin : 'http://localhost:9092');

  useEffect(() => {
    // Connect to Socket.IO if we have a token and not already connected
    if (token && !isConnectedRef.current) {
      console.log('useSocket: Connecting to Socket.IO...');
      socketService.connect(socketUrl, token);
      isConnectedRef.current = true;
    }

    // Cleanup: Disconnect on unmount
    return () => {
      if (isConnectedRef.current) {
        console.log('useSocket: Disconnecting from Socket.IO...');
        socketService.disconnect();
        isConnectedRef.current = false;
      }
    };
  }, [token, socketUrl]);

  return {
    /**
     * Register event listener
     */
    on: socketService.on.bind(socketService),
    
    /**
     * Remove event listener
     */
    off: socketService.off.bind(socketService),
    
    /**
     * Emit event to server
     */
    emit: socketService.emit.bind(socketService),
    
    /**
     * Check if socket is connected
     */
    isConnected: socketService.isConnected.bind(socketService),
  };
}

/**
 * useSocketEvent - Custom hook for listening to specific Socket.IO events
 * Automatically handles cleanup on unmount
 * 
 * @param event - Event name to listen for
 * @param handler - Callback function to handle the event
 * @param deps - Optional dependency array for the handler
 */
export function useSocketEvent<T = any>(
  event: string,
  handler: (data: T) => void,
  deps: React.DependencyList = []
) {
  const handlerRef = useRef(handler);

  // Update handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  useEffect(() => {
    // Wrapper function to use the latest handler
    const eventHandler = (data: T) => {
      handlerRef.current(data);
    };

    // Register listener
    socketService.on(event, eventHandler);
    console.log(`useSocketEvent: Registered listener for "${event}"`);

    // Cleanup: Remove listener on unmount
    return () => {
      socketService.off(event, eventHandler);
      console.log(`useSocketEvent: Removed listener for "${event}"`);
    };
  }, [event]);
}
