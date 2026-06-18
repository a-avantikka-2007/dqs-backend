const appointmentModel = require("../models/appointmentModel");
const tokenModel = require("../models/tokenModel");
const { createNotification } = require("../models/notificationModel");
const { logActivity } = require("../models/activityLogModel");

function canAccessAppointment(user, appointment) {
  return user.role !== "USER" || appointment.user_id === user.id;
}

async function bookAppointment(req, res, next) {
  try {
    const appointment = await appointmentModel.createAppointment({
      user_id: req.user.id,
      department_id: req.body.department_id,
      appointment_date: req.body.appointment_date,
      appointment_time: req.body.appointment_time,
      reason: req.body.reason
    });
    await createNotification({
      user_id: req.user.id,
      title: "Appointment requested",
      message: `Your ${appointment.department_name} appointment is pending approval.`,
      type: "APPOINTMENT_PENDING",
      related_id: appointment.id
    });
    await logActivity({
      user_id: req.user.id,
      action: "BOOKED_APPOINTMENT",
      entity_type: "APPOINTMENT",
      entity_id: appointment.id
    });
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
}

async function listAppointments(req, res, next) {
  try {
    const userId = req.user.role === "USER" ? req.user.id : req.query.user_id;
    const appointments = await appointmentModel.listAppointments({
      userId,
      status: req.query.status,
      departmentId: req.query.department_id
    });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
}

async function getAppointment(req, res, next) {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (!canAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ message: "You cannot view this appointment" });
    }
    res.json(appointment);
  } catch (error) {
    next(error);
  }
}

async function cancelAppointment(req, res, next) {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (!canAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ message: "You cannot cancel this appointment" });
    }

    const updated = await appointmentModel.updateStatus(req.params.id, "CANCELLED", req.user.id);
    await createNotification({
      user_id: appointment.user_id,
      title: "Appointment cancelled",
      message: `Your ${appointment.department_name} appointment has been cancelled.`,
      type: "APPOINTMENT_CANCELLED",
      related_id: appointment.id
    });
    await logActivity({
      user_id: req.user.id,
      action: "CANCELLED_APPOINTMENT",
      entity_type: "APPOINTMENT",
      entity_id: appointment.id
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function rescheduleAppointment(req, res, next) {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    if (!canAccessAppointment(req.user, appointment)) {
      return res.status(403).json({ message: "You cannot reschedule this appointment" });
    }

    const updated = await appointmentModel.reschedule(req.params.id, {
      appointment_date: req.body.appointment_date,
      appointment_time: req.body.appointment_time
    });
    await createNotification({
      user_id: appointment.user_id,
      title: "Appointment rescheduled",
      message: `Your ${appointment.department_name} appointment was rescheduled and is pending approval.`,
      type: "APPOINTMENT_PENDING",
      related_id: appointment.id
    });
    await logActivity({
      user_id: req.user.id,
      action: "RESCHEDULED_APPOINTMENT",
      entity_type: "APPOINTMENT",
      entity_id: appointment.id
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function updateAppointmentStatus(req, res, next) {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const status = req.body.status;
    const updated = await appointmentModel.updateStatus(req.params.id, status, req.user.id);
    let token = null;
    let title = `Appointment ${status.toLowerCase()}`;
    let type = `APPOINTMENT_${status}`;
    let message = `Your ${appointment.department_name} appointment is ${status.toLowerCase()}.`;

    if (status === "APPROVED") {
      token = await tokenModel.createToken({
        user_id: appointment.user_id,
        department_id: appointment.department_id,
        appointment_id: appointment.id
      });
      title = "Appointment approved";
      type = "APPOINTMENT_APPROVED";
      message = `Approved. Your token is ${token.token_number}.`;
    }

    await createNotification({
      user_id: appointment.user_id,
      title,
      message,
      type,
      related_id: appointment.id
    });
    await logActivity({
      user_id: req.user.id,
      action: `APPOINTMENT_${status}`,
      entity_type: "APPOINTMENT",
      entity_id: appointment.id,
      metadata: token ? { token_number: token.token_number } : null
    });

    res.json({ appointment: updated, token });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  bookAppointment,
  listAppointments,
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
  updateAppointmentStatus
};
