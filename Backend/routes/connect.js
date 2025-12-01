const express = require("express");
const { fetchSuggestions,  
    sendRequest,
  acceptRequest,
  rejectRequest,
  requestStatus,
fetchConnections } = require("../controllers/connectioncontroller");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/suggestions", authMiddleware, fetchSuggestions);
router.post("/request", authMiddleware, sendRequest);
router.post("/accept", authMiddleware, acceptRequest);
router.post("/reject", authMiddleware, rejectRequest);
router.get("/status", authMiddleware, requestStatus);
router.get("/connections", authMiddleware, fetchConnections);
module.exports = router;
