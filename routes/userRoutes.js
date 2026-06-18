const express = require("express");
const { body, param } = require("express-validator");
const userController = require("../controllers/userController");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/", userController.listUsers);

router.post(
  "/operators",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").isStrongPassword({ minLength: 8 }).withMessage("Password must be strong"),
    body("phone").optional({ nullable: true }).trim()
  ],
  validate,
  userController.createOperator
);

router.patch(
  "/:id",
  [
    param("id").isInt({ min: 1 }),
    body("role").optional().isIn(["SUPER_ADMIN", "STAFF_OPERATOR", "USER"]),
    body("status").optional().isIn(["ACTIVE", "INACTIVE"]),
    body("name").optional().trim().isLength({ min: 2 }),
    body("phone").optional({ nullable: true }).trim()
  ],
  validate,
  userController.updateUser
);

router.delete("/:id", [param("id").isInt({ min: 1 })], validate, userController.deleteUser);

module.exports = router;
