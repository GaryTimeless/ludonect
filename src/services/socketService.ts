import { io, Socket } from 'socket.io-client';
import { ref, Ref } from 'vue';
import type { GameSession } from '../../server/types';
import router from '@/router';

class SocketService {
  private socket: Socket | null = null;
  public gameState: Ref<GameSession | null> = ref(null);
  public connected: Ref<boolean> = ref(false);
  public error: Ref<string | null> = ref(null);
  public hostMigratedEvent: Ref<{ newHostId: string; newHostName: string } | null> = ref(null);
  private visibilityHandler: (() => void) | null = null;

  /**
   * Connect to the WebSocket server
   * Unterscheidet automatisch zwischen Production und Development
   */
  connect(url?: string) {
    if (this.socket?.connected) {
      console.log('[SocketService] Already connected');
      return this.socket;
    }

    let serverUrl = this.getServerUrl(url);

    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      if (!serverUrl.includes('ludonect-production.up.railway.app') && 
          !serverUrl.includes('ludonect.de') &&
          !serverUrl.includes('garytimeless.github.io')) {
        serverUrl = serverUrl
          .replace('localhost', window.location.hostname)
          .replace('127.0.0.1', window.location.hostname);
      }
    }

    console.log('[SocketService] Versuche Verbindung mit:', serverUrl);
    console.log(`[SocketService] Environment: ${import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT'}`);

    this.socket = io(serverUrl, {
      transports: ['polling', 'websocket'], // polling first: more reliable on iOS/restricted networks
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();

    // Page Visibility API: reconnect immediately when tab becomes active again
    if (!this.visibilityHandler) {
      this.visibilityHandler = () => {
        if (!document.hidden && !this.socket?.connected) {
          console.log('[SocketService] Tab visible, triggering reconnect');
          this.socket?.connect();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    return this.socket;
  }

  /**
   * Bestimme die korrekte Server-URL basierend auf der Umgebung
   */
  private getServerUrl(customUrl?: string): string {
    if (customUrl) return customUrl;

    if (import.meta.env.PROD) {
      console.log('[SocketService] Production environment detected, using Railway URL');
      return 'https://ludonect-production.up.railway.app';
    }

    const viteUrl = import.meta.env.VITE_SOCKET_URL;
    if (viteUrl) {
      console.log('[SocketService] Using VITE_SOCKET_URL:', viteUrl);
      return viteUrl;
    }

    console.log('[SocketService] Using local fallback URL');
    return 'http://localhost:3001';
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected:', this.socket?.id);
      this.connected.value = true;
      this.error.value = null;
      this.tryAutoRejoin();
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
      this.clearRoomContext();
    });
  }

  emit<T = any>(event: string, data?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout for event: ${event}`));
      }, 10000);

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

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  setRoomContext(roomCode: string): void {
    localStorage.setItem('currentRoomCode', roomCode);
  }

  clearRoomContext(): void {
    localStorage.removeItem('currentRoomCode');
  }

  private isAutoRejoining = false;

  private async tryAutoRejoin(): Promise<void> {
    // Prevent concurrent auto-rejoin attempts
    if (this.isAutoRejoining) {
      console.log('[SocketService] Auto-rejoin already in progress, skipping');
      return;
    }

    const roomCode = localStorage.getItem('currentRoomCode');
    const playerId = localStorage.getItem('playerId');
    const playerName = localStorage.getItem('playerName');
    if (!roomCode || !playerId || !playerName) return;

    this.isAutoRejoining = true;

    try {
      // Register a one-time navigateTo listener BEFORE calling joinRoom,
      // so we catch the server's redirect even if App.vue hasn't mounted yet.
      let navigated = false;
      const onNavigateTo = (path: string) => {
        if (navigated) return;
        navigated = true;
        console.log('[SocketService] Auto-rejoin navigateTo:', path);
        if (router.currentRoute.value.path !== path) {
          router.push(path);
        }
      };
      this.socket?.once('navigateTo', onNavigateTo);

      await this.emit('joinRoom', { roomCode, playerName, playerId });
      console.log('[SocketService] Auto-rejoined room:', roomCode);
    } catch (error: any) {
      console.log('[SocketService] Auto-rejoin failed, clearing room context:', error.message);
      this.clearRoomContext();
    } finally {
      this.isAutoRejoining = false;
    }
  }

  disconnect() {
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.socket) {
      console.log('[SocketService] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.gameState.value = null;
      this.connected.value = false;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();