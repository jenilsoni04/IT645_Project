const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const userIdToSocketIds = new Map();
const socketIdToUserId = new Map();
const roomIdToSocketIds = new Map();

function notifyUserLeftRoom(io, roomId, socketId) {
  const sockets = roomIdToSocketIds.get(roomId);
  if (!sockets) return;
  for (const sid of sockets) {
    io.to(sid).emit("rtc-user-left", { roomId, socketId });
  }
}

function addUserSocket(userId, socketId) {
  if (!userIdToSocketIds.has(userId)) {
    userIdToSocketIds.set(userId, new Set());
  }
  userIdToSocketIds.get(userId).add(socketId);
  socketIdToUserId.set(socketId, userId);
}

function removeUserSocket(userId, socketId) {
  const set = userIdToSocketIds.get(userId);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) userIdToSocketIds.delete(userId);
  }
  socketIdToUserId.delete(socketId);
  for (const [roomId, sockets] of roomIdToSocketIds.entries()) {
    if (sockets.delete(socketId)) {
      notifyUserLeftRoom(global.__io, roomId, socketId);
      if (sockets.size === 0) roomIdToSocketIds.delete(roomId);
    }
  }
}

function emitToUser(io, userId, event, payload) {
  const set = userIdToSocketIds.get(String(userId));
  console.log(`[emitToUser] Attempting to emit '${event}' to userId=${userId}. Active sockets: ${set ? set.size : 0}`);
  if (!set) {
    console.warn(`[emitToUser] No active sockets for userId=${userId}`);
    return;
  }
  for (const sid of set) {
    io.to(sid).emit(event, payload);
    console.log(`[emitToUser] Emitted '${event}' to socket=${sid} for userId=${userId}`);
  }
}

function joinRoom(socket, roomId) {
  if (!roomIdToSocketIds.has(roomId)) roomIdToSocketIds.set(roomId, new Set());
  const set = roomIdToSocketIds.get(roomId);
  set.add(socket.id);
  const peers = Array.from(set).filter((sid) => sid !== socket.id);
  global.__io?.to(socket.id).emit("rtc-room-users", { roomId, peers });
  for (const sid of peers) {
    global.__io?.to(sid).emit("rtc-user-joined", { roomId, socketId: socket.id });
  }
}

function leaveRoom(socket, roomId) {
  const set = roomIdToSocketIds.get(roomId);
  if (!set) return;
  if (set.delete(socket.id)) {
    notifyUserLeftRoom(global.__io, roomId, socket.id);
  }
  if (set.size === 0) {
    roomIdToSocketIds.delete(roomId);
    try {
      global.__io?.emit("meet-ended", { meetingId: String(roomId) });
    } catch (e) {
      console.error("Error emitting meet-ended event:", e.message);
    }
  }
}

function initRealtime(io) {
  // NOTE: io is already created and configured in server.js
  if (!io) {
    console.error('[initRealtime] ERROR: io instance is null or undefined');
    return;
  }
  console.log('[initRealtime] Registering socket connection handlers on existing io instance');

  io.on("connection", (socket) => {
    // Accept token from handshake.auth (preferred), handshake.query (legacy),
    // or from cookies sent by the browser in the handshake headers.
    let token = socket.handshake?.auth?.token || socket.handshake?.query?.token;
    console.log(`[Socket Connection] socketId=${socket.id}, auth.token=${!!socket.handshake?.auth?.token}, query.token=${!!socket.handshake?.query?.token}`);
    
    let userId = null;
    try {
      if (!token && socket.handshake && socket.handshake.headers && socket.handshake.headers.cookie) {
        console.log(`[Socket Connection] Attempting to parse token from cookies`);
        const raw = socket.handshake.headers.cookie.split(';').map((c) => c.trim());
        for (const pair of raw) {
          const [k, v] = pair.split('=');
          if (k === 'token') {
            token = decodeURIComponent(v || '');
            console.log(`[Socket Connection] Found token in cookies`);
            break;
          }
        }
      }

      if (token) {
        console.log(`[Socket Connection] Attempting to verify token...`);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = String(decoded.userId || decoded.id || decoded._id || (decoded.user && (decoded.user.id || decoded.user._id)) || decoded.sub || '');
        console.log(`[Socket Connection] Token decoded. Extracted userId=${userId}`);
        if (!userId) userId = null;
      } else {
        console.warn(`[Socket Connection] No token found in auth, query, or cookies`);
      }
    } catch (err) {
      console.error('Socket authentication failed:', err && err.message ? err.message : err);
    }

    if (userId) {
      addUserSocket(userId, socket.id);
      console.log(`Socket connected: userId=${userId}, socketId=${socket.id}`);
    } else {
      console.warn(`Socket connected without valid userId, socketId=${socket.id}`);
    }

    socket.on("rtc-join-room", ({ roomId }) => {
      if (!roomId) return;
      joinRoom(socket, String(roomId));
    });
    socket.on("rtc-leave-room", ({ roomId }) => {
      if (!roomId) return;
      leaveRoom(socket, String(roomId));
    });

    socket.on("rtc-user-info", ({ roomId, userName }) => {
      if (!roomId) return;
      try {
        const set = roomIdToSocketIds.get(String(roomId));
        if (!set) return;
        for (const sid of set) {
          if (sid === socket.id) continue; 
          global.__io?.to(sid).emit("rtc-peer-info", { socketId: socket.id, userName });
        }
      } catch (e) {
        console.log("Error forwarding rtc-user-info:", e.message);
      }
    });

    socket.on("rtc-offer", ({ targetSocketId, description, roomId }) => {
      if (!targetSocketId || !description) return;
      io.to(targetSocketId).emit("rtc-offer", { fromSocketId: socket.id, description, roomId });
    });
    socket.on("rtc-answer", ({ targetSocketId, description, roomId }) => {
      if (!targetSocketId || !description) return;
      io.to(targetSocketId).emit("rtc-answer", { fromSocketId: socket.id, description, roomId });
    });
    socket.on("rtc-ice-candidate", ({ targetSocketId, candidate, roomId }) => {
      if (!targetSocketId || !candidate) return;
      io.to(targetSocketId).emit("rtc-ice-candidate", { fromSocketId: socket.id, candidate, roomId });
    });

    socket.on("disconnect", () => {
      if (userId) removeUserSocket(userId, socket.id);
    });
  });

  global.__io = io;
  global.__emitToUser = (userId, event, payload) => emitToUser(io, userId, event, payload);
}

module.exports = { initRealtime };


// services/realtime.js

// const jwt = require("jsonwebtoken");

// const userIdToSocketIds = new Map();
// const socketIdToUserId = new Map();
// const roomIdToSocketIds = new Map();

// function notifyUserLeftRoom(io, roomId, socketId) {
//   const sockets = roomIdToSocketIds.get(roomId);
//   if (!sockets) return;
//   for (const sid of sockets) {
//     io.to(sid).emit("rtc-user-left", { roomId, socketId });
//   }
// }

// function addUserSocket(userId, socketId) {
//   if (!userIdToSocketIds.has(userId)) {
//     userIdToSocketIds.set(userId, new Set());
//   }
//   userIdToSocketIds.get(userId).add(socketId);
//   socketIdToUserId.set(socketId, userId);
// }

// function removeUserSocket(userId, socketId) {
//   const set = userIdToSocketIds.get(userId);
//   if (set) {
//     set.delete(socketId);
//     if (set.size === 0) userIdToSocketIds.delete(userId);
//   }
//   socketIdToUserId.delete(socketId);
//   for (const [roomId, sockets] of roomIdToSocketIds.entries()) {
//     if (sockets.delete(socketId)) {
//       notifyUserLeftRoom(global.__io, roomId, socketId);
//       if (sockets.size === 0) roomIdToSocketIds.delete(roomId);
//     }
//   }
// }

// function emitToUser(io, userId, event, payload) {
//   const key = String(userId);
//   const set = userIdToSocketIds.get(key);
//   if (!set || set.size === 0) {
//     console.warn(`emitToUser: no active sockets for userId=${key}, event=${event}`);
//     return;
//   }
//   for (const sid of set) {
//     try {
//       io.to(sid).emit(event, payload);
//       console.log(`emitToUser: emitted '${event}' to socket=${sid} for userId=${key}`);
//     } catch (e) {
//       console.error(`emitToUser: failed to emit to socket=${sid} for userId=${key}:`, e && e.message ? e.message : e);
//     }
//   }
// }

// function joinRoom(socket, roomId) {
//   if (!roomIdToSocketIds.has(roomId)) roomIdToSocketIds.set(roomId, new Set());
//   const set = roomIdToSocketIds.get(roomId);
//   set.add(socket.id);
//   const peers = Array.from(set).filter((sid) => sid !== socket.id);
//   global.__io?.to(socket.id).emit("rtc-room-users", { roomId, peers });
//   for (const sid of peers) {
//     global.__io?.to(sid).emit("rtc-user-joined", { roomId, socketId: socket.id });
//   }
// }

// function leaveRoom(socket, roomId) {
//   const set = roomIdToSocketIds.get(roomId);
//   if (!set) return;
//   if (set.delete(socket.id)) {
//     notifyUserLeftRoom(global.__io, roomId, socket.id);
//   }
//   if (set.size === 0) {
//     roomIdToSocketIds.delete(roomId);
//     try {
//       global.__io?.emit("meet-ended", { meetingId: String(roomId) });
//     } catch (e) {
//       console.error("Error emitting meet-ended event:", e.message);
//     }
//   }
// }

// // IMPORTANT: now takes `io`, does NOT create its own Server
// function initRealtime(io) {
//   io.on("connection", (socket) => {
//     const { token } = socket.handshake.query || {};
//     let userId = null;
//     try {
//       if (token) {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         userId = String(decoded.userId);
//       }
//     } catch {
//       console.error("Socket authentication failed");
//     }

//     if (userId) {
//       addUserSocket(userId, socket.id);
//     }

//     socket.on("rtc-join-room", ({ roomId }) => {
//       if (!roomId) return;
//       joinRoom(socket, String(roomId));
//     });

//     socket.on("rtc-leave-room", ({ roomId }) => {
//       if (!roomId) return;
//       leaveRoom(socket, String(roomId));
//     });

//     socket.on("rtc-user-info", ({ roomId, userName }) => {
//       if (!roomId) return;
//       try {
//         const set = roomIdToSocketIds.get(String(roomId));
//         if (!set) return;
//         for (const sid of set) {
//           if (sid === socket.id) continue;
//           global.__io?.to(sid).emit("rtc-peer-info", {
//             socketId: socket.id,
//             userName,
//           });
//         }
//       } catch (e) {
//         console.log("Error forwarding rtc-user-info:", e.message);
//       }
//     });

//     socket.on("rtc-offer", ({ targetSocketId, description, roomId }) => {
//       if (!targetSocketId || !description) return;
//       io.to(targetSocketId).emit("rtc-offer", {
//         fromSocketId: socket.id,
//         description,
//         roomId,
//       });
//     });

//     socket.on("rtc-answer", ({ targetSocketId, description, roomId }) => {
//       if (!targetSocketId || !description) return;
//       io.to(targetSocketId).emit("rtc-answer", {
//         fromSocketId: socket.id,
//         description,
//         roomId,
//       });
//     });

//     socket.on("rtc-ice-candidate", ({ targetSocketId, candidate, roomId }) => {
//       if (!targetSocketId || !candidate) return;
//       io.to(targetSocketId).emit("rtc-ice-candidate", {
//         fromSocketId: socket.id,
//         candidate,
//         roomId,
//       });
//     });

//     socket.on("disconnect", () => {
//       if (userId) removeUserSocket(userId, socket.id);
//     });
//   });

//   // Preserve globals used elsewhere in the app
//   global.__io = io;
//   global.__emitToUser = (userId, event, payload) => emitToUser(io, userId, event, payload);
// }

// module.exports = { initRealtime };
