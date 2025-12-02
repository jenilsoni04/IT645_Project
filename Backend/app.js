const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const suggestionsRoute = require("./routes/connect");
const meetingRoutes = require("./routes/meeting");
const chatRoutes = require('./routes/chat');
const subscriptionRoutes = require("./routes/subscription");
const recommendationRoutes = require("./routes/recommendation");
const path = require("path");   // ✅ ADD THIS


const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

app.use(express.json());
app.use(morgan("dev")); 
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => res.send("API is Running"));

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/connect", suggestionsRoute);
app.use("/meetings", meetingRoutes);
app.use('/chat', chatRoutes);
app.use("/subscription", subscriptionRoutes);
app.use("/recommendations", recommendationRoutes);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.get("/intro", (req, res) => {
  res.render("intro", {
    projectName: "IT645 Project Platform",
    developerName: "Jenil Soni and jainam vora" ,
  });
});

module.exports = app;