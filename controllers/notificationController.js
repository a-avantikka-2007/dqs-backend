const notificationModel = require("../models/notificationModel");

async function listNotifications(req, res, next) {
  try {
    const notifications = await notificationModel.listForUser(req.user.id);
    res.json(notifications);
  } catch (error) {
    next(error);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await notificationModel.markRead(req.params.id, req.user.id);
    res.json(notification);
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationModel.markAllRead(req.user.id);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
}

module.exports = { listNotifications, markRead, markAllRead };
