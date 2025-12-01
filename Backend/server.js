const dotenv = require("dotenv");
const { createServer } = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/db");
const app = require("./app");
const { initRealtime } = require("./services/realtime");

const { initializeSocket } = require("./socket");
const messagesRoutes = require("./routes/messages");
const messageController = require("./controllers/messageController");

dotenv.config();
connectDB();

const server = createServer(app);

const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initRealtime(io);

initializeSocket(io);

messageController.initMessageController(io);

app.use("/messages", messagesRoutes);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});