const { Server } = require("socket.io");

let io;

// Initialize WebSocket server
const initWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  // WebSocket connection event
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle events if needed
    socket.on("joinRoom", (userId) => {
      socket.join(userId); // Joining the user-specific room
      // console.log(`User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      // console.log("User disconnected:", socket.id);
    });
  });
};

// Emit function to send real-time notifications
const sendNotification = (userId, data) => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }

  // console.log("emitting for " + userId);
  io.to(userId).emit("taskNotification", data);
};

module.exports = { initWebSocket, sendNotification };
