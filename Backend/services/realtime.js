// const { Server } = require("socket.io");
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
//   const set = userIdToSocketIds.get(String(userId));
//   if (!set) return;
//   for (const sid of set) {
//     io.to(sid).emit(event, payload);
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

// function initRealtime(server) {
//   const io = new Server(server, {
//     cors: { origin: "*", methods: ["GET", "POST"] },
//   });

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
//           global.__io?.to(sid).emit("rtc-peer-info", { socketId: socket.id, userName });
//         }
//       } catch (e) {
//         console.log("Error forwarding rtc-user-info:", e.message);
//       }
//     });

//     socket.on("rtc-offer", ({ targetSocketId, description, roomId }) => {
//       if (!targetSocketId || !description) return;
//       io.to(targetSocketId).emit("rtc-offer", { fromSocketId: socket.id, description, roomId });
//     });
//     socket.on("rtc-answer", ({ targetSocketId, description, roomId }) => {
//       if (!targetSocketId || !description) return;
//       io.to(targetSocketId).emit("rtc-answer", { fromSocketId: socket.id, description, roomId });
//     });
//     socket.on("rtc-ice-candidate", ({ targetSocketId, candidate, roomId }) => {
//       if (!targetSocketId || !candidate) return;
//       io.to(targetSocketId).emit("rtc-ice-candidate", { fromSocketId: socket.id, candidate, roomId });
//     });

//     socket.on("disconnect", () => {
//       if (userId) removeUserSocket(userId, socket.id);
//     });
//   });

//   global.__io = io;
//   global.__emitToUser = (userId, event, payload) => emitToUser(io, userId, event, payload);
// }

// module.exports = { initRealtime };


// services/realtime.js

const jwt = require("jsonwebtoken");

// Mapping structures
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
  if (!set) return;
  for (const sid of set) {
    io.to(sid).emit(event, payload);
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

// IMPORTANT: now takes `io`, does NOT create its own Server
function initRealtime(io) {
  io.on("connection", (socket) => {
    const { token } = socket.handshake.query || {};
    let userId = null;
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = String(decoded.userId);
      }
    } catch {
      console.error("Socket authentication failed");
    }

    if (userId) {
      addUserSocket(userId, socket.id);
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
          global.__io?.to(sid).emit("rtc-peer-info", {
            socketId: socket.id,
            userName,
          });
        }
      } catch (e) {
        console.log("Error forwarding rtc-user-info:", e.message);
      }
    });

    socket.on("rtc-offer", ({ targetSocketId, description, roomId }) => {
      if (!targetSocketId || !description) return;
      io.to(targetSocketId).emit("rtc-offer", {
        fromSocketId: socket.id,
        description,
        roomId,
      });
    });

    socket.on("rtc-answer", ({ targetSocketId, description, roomId }) => {
      if (!targetSocketId || !description) return;
      io.to(targetSocketId).emit("rtc-answer", {
        fromSocketId: socket.id,
        description,
        roomId,
      });
    });

    socket.on("rtc-ice-candidate", ({ targetSocketId, candidate, roomId }) => {
      if (!targetSocketId || !candidate) return;
      io.to(targetSocketId).emit("rtc-ice-candidate", {
        fromSocketId: socket.id,
        candidate,
        roomId,
      });
    });

    socket.on("disconnect", () => {
      if (userId) removeUserSocket(userId, socket.id);
    });
  });

  // Preserve globals used elsewhere in the app
  global.__io = io;
  global.__emitToUser = (userId, event, payload) => emitToUser(io, userId, event, payload);
}

module.exports = { initRealtime };
