const express = require("express");
const activityLogController = require("../controllers/activityLogController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN"));
router.get("/", activityLogController.listActivityLogs);

module.exports = router;
