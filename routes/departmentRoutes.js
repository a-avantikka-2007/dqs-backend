const express = require("express");
const { body, param } = require("express-validator");
const departmentController = require("../controllers/departmentController");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, departmentController.listDepartments);

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  [
    body("name").trim().isLength({ min: 2 }),
    body("code").trim().isLength({ min: 2, max: 20 }),
    body("category").isIn(["Hospital", "Bank", "College"]),
    body("average_service_minutes").optional().isInt({ min: 1, max: 240 }),
    body("status").optional().isIn(["ACTIVE", "INACTIVE"])
  ],
  validate,
  departmentController.createDepartment
);

router.put(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  [
    param("id").isInt({ min: 1 }),
    body("name").optional().trim().isLength({ min: 2 }),
    body("code").optional().trim().isLength({ min: 2, max: 20 }),
    body("category").optional().isIn(["Hospital", "Bank", "College"]),
    body("average_service_minutes").optional().isInt({ min: 1, max: 240 }),
    body("status").optional().isIn(["ACTIVE", "INACTIVE"])
  ],
  validate,
  departmentController.updateDepartment
);

router.delete(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  [param("id").isInt({ min: 1 })],
  validate,
  departmentController.deleteDepartment
);

module.exports = router;
