const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { recommendVideos } = require("../controllers/recommendationController");

const router = express.Router();

router.post("/", authMiddleware, recommendVideos);

module.exports = router;


