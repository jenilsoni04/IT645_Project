const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const suggestionsRoute = require("./routes/connect");
const meetingRoutes = require("./routes/meeting");
const chatRoutes = require('./routes/chat');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => res.send("API is Running"));

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/connect", suggestionsRoute);
app.use("/meetings", meetingRoutes);
app.use('/chat', chatRoutes);

module.exports = app;