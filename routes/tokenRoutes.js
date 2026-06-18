const express = require("express");
const { body, param } = require("express-validator");
const tokenController = require("../controllers/tokenController");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/", [body("department_id").isInt({ min: 1 })], validate, tokenController.createToken);
router.get("/", tokenController.listTokens);
router.get("/:id/position", [param("id").isInt({ min: 1 })], validate, tokenController.getPosition);

router.post(
  "/call-next",
  authorize("SUPER_ADMIN", "STAFF_OPERATOR"),
  [body("department_id").isInt({ min: 1 })],
  validate,
  tokenController.callNext
);

router.patch(
  "/:id/status",
  authorize("SUPER_ADMIN", "STAFF_OPERATOR"),
  [param("id").isInt({ min: 1 }), body("status").isIn(["CALLED", "COMPLETED", "SKIPPED"])],
  validate,
  tokenController.updateStatus
);

module.exports = router;
