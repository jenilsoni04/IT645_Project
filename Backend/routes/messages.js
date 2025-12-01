const express = require("express");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const messageController = require("../controllers/messageController");

const router = express.Router();

router.get("/:userId", auth, messageController.getMessages);
router.post("/", auth, upload.single("file"), messageController.sendMessage);

module.exports = router;
