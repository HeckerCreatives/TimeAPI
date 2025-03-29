const connectedUsers = new Map();

const sockethandler = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("login", (userData) => {
      const { userId } = userData;

      connectedUsers.set(userId, socket.id);
      console.log(`User logged in: ${userId}, socket ID: ${socket.id}`);

      socket.emit("welcome", { message: `Welcome, ${userId}!` });
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User disconnected: ${userId}`);
          break;
        }
      }
    });

    socket.on("setpricepool", (data) => {
      console.log("Setting price pool:", data);

      for (const [userId, socketId] of connectedUsers.entries()) {
        io.to(socketId).emit("update-pricepool", data);
      }
    });
  });
};

module.exports = sockethandler;
