const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { 
  registerValidationRules, 
  loginValidationRules, 
  verificationValidationRules, 
  validate 
} = require("../utils/validators");
const { 
    register,
    login,
    me,
    verifyEmail
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerValidationRules(), validate, register);
router.post("/login", loginValidationRules(), validate, login);
router.get("/me", authMiddleware, me);
router.post("/verify", verificationValidationRules(), validate, verifyEmail);

module.exports = router;