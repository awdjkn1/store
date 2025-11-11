/* CONVERTED inline px→rem by scripts/convert-inline-px-to-rem.js on 2025-11-11T19:57:09.477Z */
// src/utils/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
let socket;

export function connectSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { withCredentials: true });
  }
  return socket;
}

export function getSocket() {
  return socket;
}
