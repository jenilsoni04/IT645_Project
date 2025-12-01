const jwt = require('jsonwebtoken');
const Message = require('./models/Message');

let ioInstance = null;
const onlineUsers = new Map();

function initializeSocket(io) {
  ioInstance = io;

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
      null;

    if (!token) return next(new Error('Authentication error: No token provided'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id || decoded._id;
      if (!userId) return next(new Error('Authentication error: token missing user id'));

      socket.userId = String(userId);
      socket.join(`user:${socket.userId}`);
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id, 'userId:', socket.userId);
    
    // Auto-join if userId is already set from auth middleware
    if (socket.userId) {
      const id = String(socket.userId);
      onlineUsers.set(id, socket.id);
      socket.join(`user:${id}`);
      console.log('Auto-joined user room:', id);
    }

    socket.on('join', (userId) => {
      const id = String(userId || socket.userId);
      onlineUsers.set(id, socket.id);
      socket.userId = id;
      socket.join(`user:${id}`);
      console.log('User joined room:', id);
    });

    socket.on('sendMessage', async ({ savedMessage }) => {
      if (!savedMessage) return;
      const receiverId = String(savedMessage.receiver);
      io.to(`user:${receiverId}`).emit('newMessage', savedMessage);
      socket.emit('messageSent', savedMessage);
    });

    socket.on('openConversation', async ({ conversationId, openerId }) => {
      await Message.updateMany(
        { conversationId, receiver: openerId, read: false },
        { $set: { read: true } }
      );
      const anyMsg = await Message.findOne({ conversationId }).lean();
      if (anyMsg) {
        const other = anyMsg.participants.map(String).find(id => id !== String(openerId));
        if (other) io.to(`user:${other}`).emit('conversationRead', { conversationId, reader: openerId });
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) onlineUsers.delete(String(socket.userId));
    });
  });
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
}

module.exports = { initializeSocket, getIO, onlineUsers };
