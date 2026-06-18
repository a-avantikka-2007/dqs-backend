const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const analyticsModel = require("../models/analyticsModel");
const appointmentModel = require("../models/appointmentModel");
const tokenModel = require("../models/tokenModel");
const { logActivity } = require("../models/activityLogModel");

async function reportData() {
  const [summary, traffic, trends, appointments, tokens] = await Promise.all([
    analyticsModel.getSummary(),
    analyticsModel.departmentTraffic(),
    analyticsModel.weeklyTrends(),
    appointmentModel.listAppointments(),
    tokenModel.listTokens({ todayOnly: false })
  ]);

  return { summary, traffic, trends, appointments, tokens };
}

async function pdfReport(req, res, next) {
  try {
    const data = await reportData();
    const doc = new PDFDocument({ margin: 48 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=digital-queue-report.pdf");
    doc.pipe(res);

    doc.fontSize(22).text("Digital Queue System Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(16).text("Summary");
    Object.entries(data.summary).forEach(([key, value]) => {
      doc.fontSize(11).text(`${key.replace(/_/g, " ")}: ${value}`);
    });
    doc.moveDown();

    doc.fontSize(16).text("Department Traffic");
    data.traffic.forEach((row) => {
      doc.fontSize(10).text(`${row.name} (${row.code}) - Tokens: ${row.token_count}, Appointments: ${row.appointment_count}`);
    });
    doc.moveDown();

    doc.fontSize(16).text("Recent Appointments");
    data.appointments.slice(0, 25).forEach((row) => {
      doc
        .fontSize(9)
        .text(`${row.appointment_date} ${row.appointment_time} - ${row.user_name} - ${row.department_name} - ${row.status}`);
    });

    doc.end();
    await logActivity({ user_id: req.user.id, action: "DOWNLOADED_PDF_REPORT", entity_type: "REPORT" });
  } catch (error) {
    next(error);
  }
}

async function excelReport(req, res, next) {
  try {
    const data = await reportData();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "DigitalQueueSystem";

    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 20 }
    ];
    Object.entries(data.summary).forEach(([metric, value]) => summarySheet.addRow({ metric, value }));

    const trafficSheet = workbook.addWorksheet("Department Traffic");
    trafficSheet.columns = [
      { header: "Department", key: "name", width: 30 },
      { header: "Code", key: "code", width: 14 },
      { header: "Tokens", key: "token_count", width: 14 },
      { header: "Appointments", key: "appointment_count", width: 16 }
    ];
    trafficSheet.addRows(data.traffic);

    const appointmentSheet = workbook.addWorksheet("Appointments");
    appointmentSheet.columns = [
      { header: "User", key: "user_name", width: 24 },
      { header: "Department", key: "department_name", width: 24 },
      { header: "Date", key: "appointment_date", width: 16 },
      { header: "Time", key: "appointment_time", width: 16 },
      { header: "Status", key: "status", width: 16 }
    ];
    appointmentSheet.addRows(data.appointments);

    const tokenSheet = workbook.addWorksheet("Tokens");
    tokenSheet.columns = [
      { header: "Token", key: "token_number", width: 18 },
      { header: "User", key: "user_name", width: 24 },
      { header: "Department", key: "department_name", width: 24 },
      { header: "Status", key: "status", width: 16 },
      { header: "Created", key: "created_at", width: 24 }
    ];
    tokenSheet.addRows(data.tokens);

    workbook.eachSheet((sheet) => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=digital-queue-report.xlsx");
    await workbook.xlsx.write(res);
    res.end();
    await logActivity({ user_id: req.user.id, action: "DOWNLOADED_EXCEL_REPORT", entity_type: "REPORT" });
  } catch (error) {
    next(error);
  }
}

module.exports = { pdfReport, excelReport };
