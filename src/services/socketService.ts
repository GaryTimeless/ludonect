import { io, Socket } from 'socket.io-client';
import { ref, Ref } from 'vue';
import type { GameSession } from '../../server/types';

class SocketService {
  private socket: Socket | null = null;
  public gameState: Ref<GameSession | null> = ref(null);
  public connected: Ref<boolean> = ref(false);
  public error: Ref<string | null> = ref(null);
  public hostMigratedEvent: Ref<{ newHostId: string; newHostName: string } | null> = ref(null);

  /**
   * Connect to the WebSocket server
   */
  connect(url?: string) {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected');
      return this.socket;
    }

    let serverUrl = url || import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    // When accessed via network IP (e.g. phone in same WiFi), replace localhost or 127.0.0.1 with real IP
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      serverUrl = serverUrl
        .replace('localhost', window.location.hostname)
        .replace('127.0.0.1', window.location.hostname);
    }

    console.log('[SocketService] Versuche Verbindung mit:', serverUrl);
    console.log(`[SocketService] Connecting to ${serverUrl}...`);

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();

    return this.socket;
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected:', this.socket?.id);
      this.connected.value = true;
      this.error.value = null;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
      this.connected.value = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection error:', error);
      this.error.value = 'Failed to connect to server';
      this.connected.value = false;
    });

    this.socket.on('gameUpdate', (game: GameSession) => {
      console.log('[SocketService] Game update received:', game);
      this.gameState.value = game;
    });

    this.socket.on('hostDisconnected', (data: { message: string; timeoutSeconds: number }) => {
      console.log('[SocketService] Host disconnected:', data);
      // This event can be handled by components if needed
    });

    this.socket.on('hostReconnected', (data: { message: string }) => {
      console.log('[SocketService] Host reconnected:', data);
    });

    this.socket.on('hostMigrated', (data: { newHostId: string; newHostName: string }) => {
      console.log('[SocketService] Host migrated:', data);
      this.hostMigratedEvent.value = data;
    });

    this.socket.on('gameEnded', (data: { reason: string; message: string }) => {
      console.log('[SocketService] Game ended:', data);
      alert(data.message);
      this.gameState.value = null;
      // Navigation will be handled by the component
    });
  }

  /**
   * Emit an event and wait for callback response
   */
  emit<T = any>(event: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout for event: ${event}`));
      }, 10000); // 10 second timeout

      this.socket.emit(event, data, (response: any) => {
        clearTimeout(timeout);

        if (response?.success === false) {
          reject(new Error(response.error || 'Unknown error'));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Listen for an event
   */
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  /**
   * Get current socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      console.log('[SocketService] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.gameState.value = null;
      this.connected.value = false;
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
