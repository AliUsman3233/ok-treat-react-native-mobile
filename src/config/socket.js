import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

let socket = null;

/**
 * Connect to the socket.io server using the stored auth token.
 * Safe to call multiple times -- returns the existing socket if already connected.
 */
export const connectSocket = async () => {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem('authToken');
  if (!token) return null;

  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.log('Socket connection error:', err.message);
  });

  return socket;
};

/**
 * Return the current socket instance (may be null if not yet connected).
 */
export const getSocket = () => socket;

/**
 * Disconnect and clear the socket instance.
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
