const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { createMeeting, getMeeting } = require("../controllers/meetingController");

const router = express.Router();

router.post("/", authMiddleware, createMeeting);

router.get("/:id", authMiddleware, getMeeting);

module.exports = router;



