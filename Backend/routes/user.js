const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/profile/:id", authMiddleware, userController.getProfile);
router.put("/update-profile/:id", authMiddleware, userController.updateProfile);
router.get("/:id", authMiddleware, userController.getUser);
module.exports = router;