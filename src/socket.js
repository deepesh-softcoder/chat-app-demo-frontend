import { io } from 'socket.io-client';
import { NativeModules, Platform } from 'react-native';

const getServerUrl = () => {
  if (process.env.SOCKET_SERVER_URL) {
    return process.env.SOCKET_SERVER_URL;
  }

  const isEmulator = NativeModules.PlatformConstants.isTesting;

  const API_URL = isEmulator
    ? 'http://10.0.2.2:5001'
    : 'http://192.168.1.12:5001';
  // const API_URL = 'https://chat-app-backend-efle.onrender.com';

  // Android emulator cannot access localhost directly.
  return API_URL;
};

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    this.eventQueue = []; // Queue events until connected
  }

  connect(token, userId) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      this.processEventQueue();
      return this.socket;
    }

    console.log('Connecting to socket server...');

    this.socket = io(getServerUrl(), {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token,
      },
      query: {
        userId,
      },
    });

    this.setupEventListeners(userId);
    return this.socket;
  }

  setupEventListeners(userId) {
    this.socket.on('connect', () => {
      console.log('✅ Socket connected');

      this.connectionAttempts = 0;
      this.reregisterListeners();
      this.processEventQueue();
    });

    this.socket.on('connect_error', error => {
      console.log('Socket connection error:', error.message);
      this.connectionAttempts++;

      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        console.log('Max connection attempts reached');
      }
    });

    this.socket.on('disconnect', reason => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('reconnect', attemptNumber => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.reregisterListeners();
      this.processEventQueue();
    });

    this.socket.on('error', error => {
      console.log('Socket error:', error);
    });
    this.socket.on('online_users_update', users => {
      // console.log('Received online users update:', users);
    });
  }

  reregisterListeners() {
    // Re-register all stored listeners
    this.listeners.forEach((callback, event) => {
      this.socket.off(event);
      this.socket.on(event, callback);
    });
  }

  processEventQueue() {
    if (this.eventQueue.length > 0) {
      console.log(`Processing ${this.eventQueue.length} queued events`);
      this.eventQueue.forEach(({ event, data }) => {
        this.emit(event, data);
      });
      this.eventQueue = [];
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.eventQueue = [];
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  on(event, callback) {
    // Store listener for reconnection
    this.listeners.set(event, callback);

    if (this.socket) {
      // Remove existing listener to avoid duplicates
      this.socket.off(event);
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    this.listeners.delete(event);
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      // console.log(`Emitting ${event}:`, data);
      this.socket.emit(event, data);
    } else {
      console.log(`Socket not connected, queueing event: ${event}`);
      // Queue the event to be sent when connected
      this.eventQueue.push({ event, data });

      // Try to connect if not already connecting
      if (!this.socket || !this.socket.connected) {
        console.log('Attempting to reconnect...');
        this.socket?.connect();
      }
    }
  }

  // Wait for connection and then emit
  emitWhenReady(event, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        this.socket.emit(event, data);
        resolve();
      } else {
        const timeoutId = setTimeout(() => {
          clearTimeout(timeoutId);
          reject(
            new Error(`Timeout: Could not emit ${event} within ${timeout}ms`),
          );
        }, timeout);

        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            clearTimeout(timeoutId);
            this.socket.emit(event, data);
            resolve();
          }
        }, 100);
      }
    });
  }

  // Request with response
  emitWithAck(event, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout: No acknowledgment for ${event}`));
      }, timeout);

      this.socket.emit(event, data, response => {
        clearTimeout(timeoutId);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });
  }
}

const socketService = new SocketService();
export default socketService;
