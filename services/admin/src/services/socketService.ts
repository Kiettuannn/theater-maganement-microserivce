import { io, Socket } from 'socket.io-client';

/**
 * SocketService - Singleton service for managing Socket.IO connections
 * 
 * Pattern: Singleton with class-based approach
 * - Ensures only one socket connection exists globally
 * - Manages connection lifecycle and event listeners
 * - Handles JWT authentication and reconnection
 * 
 * Usage:
 *   import { socketService } from '@/services/socketService';
 *   socketService.connect(url, token);
 *   socketService.on('event', handler);
 */
class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnecting: boolean = false;
  private currentToken: string | null = null;
  private connectionUrl: string = '';

  /**
   * Connect to Socket.IO server with JWT token authentication
   * 
   * @param url - Socket.IO server URL
   * @param token - JWT access token for authentication
   * 
   * Note: Connection URL includes token as query parameter for backend verification
   */
  connect(url: string = 'http://localhost:9092', token: string): void {
    // Guard: Already connected or connecting
    if (this.socket?.connected || this.isConnecting) {
      console.log('[SocketService] Already connected or connecting');
      return;
    }

    // Guard: Token is required
    if (!token) {
      console.error('[SocketService] Cannot connect: JWT token is required');
      return;
    }

    this.isConnecting = true;
    this.currentToken = token;
    this.connectionUrl = `${url}?token=${token}`;

    console.log('[SocketService] Connecting to:', url);

    // Create Socket.IO connection with configuration
    this.socket = io(this.connectionUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.setupEventHandlers();
    this.attachUserListeners();
  }

  /**
   * Setup internal Socket.IO event handlers
   * Handles connection, disconnection, and errors
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      console.log('[SocketService] Connected with ID:', this.socket?.id);
      this.isConnecting = false;
      
      // IMPORTANT: Attach all user listeners when connection is established
      this.attachUserListeners();
    });

    // Connection lost
    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected. Reason:', reason);
      this.isConnecting = false;
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error.message);
      this.isConnecting = false;
    });

    // General error
    this.socket.on('error', (error) => {
      console.error('[SocketService] Socket error:', error);
    });
  }

  /**
   * Attach user-registered event listeners to the socket
   * Called on initial connect and automatically handled by Socket.IO on reconnect
   */
  private attachUserListeners(): void {
    if (!this.socket) return;

    console.log(`[SocketService] Attaching ${this.listeners.size} user listeners to socket`);
    
    this.listeners.forEach((callbacks, event) => {
      console.log(`[SocketService] Attaching ${callbacks.size} listener(s) for event: "${event}"`);
      
      callbacks.forEach((callback) => {
        // Wrap callback to add debugging
        const wrappedCallback = (...args: any[]) => {
          console.log(`[SocketService] 🎯 Event "${event}" received with args:`, args);
          callback(...args);
        };
        
        this.socket?.on(event, wrappedCallback as any);
      });
    });
    
    console.log('[SocketService] All user listeners attached');
  }

  /**
   * Disconnect from Socket.IO server and cleanup all resources
   * Should be called when user logs out or component unmounts
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[SocketService] Disconnecting...');
      
      // Remove all user listeners from socket
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          this.socket?.off(event, callback as any);
        });
      });
      
      this.socket.disconnect();
      this.socket = null;
      this.currentToken = null;
      this.connectionUrl = '';
      this.listeners.clear();
      
      console.log('[SocketService] Disconnected and cleaned up');
    }
  }

  /**
   * Register event listener
   * Uses Set to prevent duplicate listeners automatically
   * 
   * @param event - Event name to listen for
   * @param callback - Callback function to handle the event
   */
  on(event: string, callback: Function): void {
    console.log(`[SocketService] Registering listener for event: "${event}"`);
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const callbacks = this.listeners.get(event)!;
    
    // Set automatically prevents duplicates
    if (!callbacks.has(callback)) {
      callbacks.add(callback);
      
      // Register with socket if already connected
      if (this.socket?.connected) {
        console.log(`[SocketService] Socket connected, attaching listener for "${event}" immediately`);
        
        // Wrap callback to add debugging
        const wrappedCallback = (...args: any[]) => {
          console.log(`[SocketService] 🎯 Event "${event}" received with args:`, args);
          callback(...args);
        };
        
        this.socket.on(event, wrappedCallback as any);
      } else {
        console.log(`[SocketService] Socket not connected yet, will attach listener for "${event}" on connect`);
      }
    } else {
      console.log(`[SocketService] Listener for "${event}" already registered`);
    }
  }

  /**
   * Remove event listener
   * 
   * @param event - Event name
   * @param callback - Optional specific callback to remove. If omitted, removes all listeners for the event
   */
  off(event: string, callback?: Function): void {
    if (callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        this.socket?.off(event, callback as any);
        
        // Clean up empty Set
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    } else {
      // Remove all listeners for this event
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach((cb) => {
          this.socket?.off(event, cb as any);
        });
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit event to server
   * Only works when socket is connected
   * 
   * @param event - Event name
   * @param data - Data to send
   */
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[SocketService] Cannot emit: Socket not connected');
    }
  }

  /**
   * Check if socket is currently connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current JWT token used for connection
   */
  getToken(): string | null {
    return this.currentToken;
  }

  /**
   * Get socket ID (only available when connected)
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

/**
 * Singleton instance of SocketService
 * Import and use this instance throughout your application
 * 
 * @example
 * import { socketService } from '@/services/socketService';
 * 
 * // Connect
 * socketService.connect('http://localhost:9092', token);
 * 
 * // Listen to events
 * socketService.on('notification:new', (data) => {
 *   console.log('New notification:', data);
 * });
 * 
 * // Emit events
 * socketService.emit('custom:event', { message: 'hello' });
 * 
 * // Disconnect
 * socketService.disconnect();
 */
export const socketService = new SocketService();
