const express = require("express");
const { body, param } = require("express-validator");
const appointmentController = require("../controllers/appointmentController");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  [
    body("department_id").isInt({ min: 1 }),
    body("appointment_date").isISO8601().toDate(),
    body("appointment_time").matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/),
    body("reason").trim().isLength({ min: 3, max: 500 })
  ],
  validate,
  appointmentController.bookAppointment
);

router.get("/", appointmentController.listAppointments);
router.get("/:id", [param("id").isInt({ min: 1 })], validate, appointmentController.getAppointment);

router.patch(
  "/:id/cancel",
  [param("id").isInt({ min: 1 })],
  validate,
  appointmentController.cancelAppointment
);

router.patch(
  "/:id/reschedule",
  [
    param("id").isInt({ min: 1 }),
    body("appointment_date").isISO8601().toDate(),
    body("appointment_time").matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  ],
  validate,
  appointmentController.rescheduleAppointment
);

router.patch(
  "/:id/status",
  authorize("SUPER_ADMIN", "STAFF_OPERATOR"),
  [param("id").isInt({ min: 1 }), body("status").isIn(["APPROVED", "REJECTED", "COMPLETED", "CANCELLED"])],
  validate,
  appointmentController.updateAppointmentStatus
);

module.exports = router;
