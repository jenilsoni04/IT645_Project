const { body, validationResult } = require("express-validator");

exports.registerValidationRules = () => [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$/)
    .withMessage("Name must contain only letters and spaces"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty().withMessage("Password is required")
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,14}$/)
    .withMessage(
      "Password must be 6-14 chars, include uppercase, lowercase, digit, and special character"
    ),

  body("skillsHave")
    .isArray({ min: 1, max: 3 })
    .withMessage("You must provide 1 to 3 skills in 'skillsHave'")
    .custom((arr) => {
      if (!arr.every(skill => typeof skill === "string" && skill.trim() !== "")) {
        throw new Error("Each skill in 'skillsHave' must be a non-empty string");
      }
      const lower = arr.map(s => s.toLowerCase());
      if (new Set(lower).size !== arr.length) {
        throw new Error("'skillsHave' contains duplicate skills");
      }
      return true;
    }),

  body("skillsWant")
    .isArray({ min: 1, max: 3 })
    .withMessage("You must provide 1 to 3 skills in 'skillsWant'")
    .custom((arr, { req }) => {
      if (!arr.every(skill => typeof skill === "string" && skill.trim() !== "")) {
        throw new Error("Each skill in 'skillsWant' must be a non-empty string");
      }
      const lower = arr.map(s => s.toLowerCase());
      if (new Set(lower).size !== arr.length) {
        throw new Error("'skillsWant' contains duplicate skills");
      }
      const have = (req.body.skillsHave || []).map(s => s.toLowerCase());
      const overlap = lower.filter(skill => have.includes(skill));
      if (overlap.length > 0) {
        throw new Error(`These skills cannot be in both 'skillsHave' and 'skillsWant': ${overlap.join(", ")}`);
      }
      return true;
    }),
];

exports.loginValidationRules = () => [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

exports.verificationValidationRules = () => [
  body("code")
    .trim()
    .notEmpty().withMessage("Verification code is required")
    .isLength({ min: 6, max: 6 }).withMessage("Verification code must be exactly 6 digits")
    .matches(/^\d+$/).withMessage("Verification code must contain only digits"),
];

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
    });
  }
  next();
};
