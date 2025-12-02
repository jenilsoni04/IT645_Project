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


import { io } from 'socket.io-client';

let socket = null;
export function getSocket(token) {
  if (socket) return socket;
  socket = io("http://localhost:3000", {
    transports: ["websocket"],
    query: { token },
    autoConnect: true,
  });
  return socket;
}


export function initSocket(token, userId) {
  if (socket && socket.connected) {
    if (userId) socket.emit('join', userId);
    return socket;
  }

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

export function getSocketInstance() {
  return socket;
}


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
