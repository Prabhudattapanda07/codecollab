const Code = require('../models/Code');

// Store active users in rooms
const rooms = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', ({ roomId, userName }) => {
      socket.join(roomId);
      
      // Add user to room tracking
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      rooms.get(roomId).set(socket.id, userName);

      // Get all users in room
      const usersInRoom = Array.from(rooms.get(roomId).values());

      // Notify others that user joined
      socket.to(roomId).emit('user-joined', {
        userName,
        socketId: socket.id,
        users: usersInRoom
      });

      // Send current users list to the new user
      socket.emit('room-users', usersInRoom);

      console.log(`${userName} joined room ${roomId}`);
    });

    // Code change
    socket.on('code-change', ({ roomId, code }) => {
      socket.to(roomId).emit('code-update', { code });
    });

    // Language change
    socket.on('language-change', ({ roomId, language }) => {
      socket.to(roomId).emit('language-update', { language });
    });

    // Chat message
    socket.on('chat-message', ({ roomId, message, userName, timestamp }) => {
      io.to(roomId).emit('chat-message', {
        message,
        userName,
        timestamp,
        socketId: socket.id
      });
    });

    // Code execution result
    socket.on('code-output', ({ roomId, output }) => {
      socket.to(roomId).emit('code-output', { output });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);

      // Find and remove user from all rooms
      rooms.forEach((roomUsers, roomId) => {
        if (roomUsers.has(socket.id)) {
          const userName = roomUsers.get(socket.id);
          roomUsers.delete(socket.id);

          // Notify others in the room
          socket.to(roomId).emit('user-left', {
            userName,
            socketId: socket.id,
            users: Array.from(roomUsers.values())
          });

          // Clean up empty rooms
          if (roomUsers.size === 0) {
            rooms.delete(roomId);
          }
        }
      });
    });

    // Leave room explicitly
    socket.on('leave-room', ({ roomId }) => {
      if (rooms.has(roomId)) {
        const roomUsers = rooms.get(roomId);
        if (roomUsers.has(socket.id)) {
          const userName = roomUsers.get(socket.id);
          roomUsers.delete(socket.id);

          socket.to(roomId).emit('user-left', {
            userName,
            socketId: socket.id,
            users: Array.from(roomUsers.values())
          });

          if (roomUsers.size === 0) {
            rooms.delete(roomId);
          }
        }
      }
      socket.leave(roomId);
    });
  });
};

module.exports = socketHandler;
