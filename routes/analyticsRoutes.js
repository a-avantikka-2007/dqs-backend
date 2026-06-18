const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/summary", authorize("SUPER_ADMIN", "STAFF_OPERATOR"), analyticsController.summary);
router.get("/traffic", authorize("SUPER_ADMIN", "STAFF_OPERATOR"), analyticsController.traffic);
router.get("/trends", authorize("SUPER_ADMIN", "STAFF_OPERATOR"), analyticsController.trends);
router.get("/crowd", analyticsController.crowd);

module.exports = router;
