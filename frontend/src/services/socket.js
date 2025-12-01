// import { io } from "socket.io-client";

// let socket = null;

// export function getSocket(token) {
//   if (socket) return socket;
//   socket = io("http://localhost:3000", {
//     transports: ["websocket"],
//     query: { token },
//     autoConnect: true,
//   });
//   return socket;
// }

// export function disconnectSocket() {
//   if (socket) {
//     try {
//       socket.disconnect();
//     } catch {
//       console.error("Error disconnecting socket");
//     }
//     socket = null;
//   }
// }



// import { io } from "socket.io-client";

// let socket = null;

// export function getSocket(token) {
//   if (socket) return socket;

//   socket = io("http://localhost:3000", {
//     transports: ["websocket"],
//     // 🔹 send token in auth (server reads auth.token first)
//     auth: { token },
//     autoConnect: true,
//   });

//   return socket;
// }

// export function disconnectSocket() {
//   if (socket) {
//     try {
//       socket.disconnect();
//     } catch (err) {
//       console.error("Error disconnecting socket", err);
//     }
//     socket = null;
//   }
// }


// src/services/socket.js
import { io } from 'socket.io-client';

let socket = null;

/**
 * KEEP THIS FUNCTION EXACT (per your request).
 * If socket already exists, returns it. Otherwise creates a socket using query token.
 */
export function getSocket(token) {
  if (socket) return socket;
  socket = io("http://localhost:3000", {
    transports: ["websocket"],
    query: { token },
    autoConnect: true,
  });
  return socket;
}

/**
 * Initialize socket with auth in `auth` (preferred) and optional join.
 * If a socket already exists and is connected, it will reuse it and emit join.
 * This function can be used instead of getSocket(token) when you want `auth` field
 * and to emit a 'join' after connect.
 */
export function initSocket(token, userId) {
  // If socket already exists and connected, reuse and ensure join emitted
  if (socket && socket.connected) {
    if (userId) socket.emit('join', userId);
    return socket;
  }

  // Create socket using auth (handshake.auth)
  socket = io('http://localhost:3000', {
    auth: token ? { token } : undefined,
    transports: ['websocket'],
    autoConnect: true,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    if (userId) {
      socket.emit('join', userId);
    }
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect_error:', err && err.message ? err.message : err);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
}

/**
 * Returns the current socket instance (no creation). Named differently to avoid
 * clashing with getSocket(token) which you asked to keep exact.
 */
export function getSocketInstance() {
  return socket;
}

/**
 * KEEP THIS FUNCTION EXACT (per your request).
 * Disconnects and nullifies socket with try/catch.
 */
export function disconnectSocket() {
  if (socket) {
    try {
      socket.disconnect();
    } catch {
      console.error("Error disconnecting socket");
    }
    socket = null;
  }
}
