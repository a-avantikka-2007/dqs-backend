const express = require("express");
const reportController = require("../controllers/reportController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/pdf", reportController.pdfReport);
router.get("/excel", reportController.excelReport);

module.exports = router;
