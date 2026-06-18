const tokenModel = require("../models/tokenModel");
const { createNotification } = require("../models/notificationModel");
const { logActivity } = require("../models/activityLogModel");

async function createToken(req, res, next) {
  try {
    const token = await tokenModel.createToken({
      user_id: req.user.id,
      department_id: req.body.department_id
    });
    const position = await tokenModel.getQueuePosition(token.id);
    await createNotification({
      user_id: req.user.id,
      title: "Token generated",
      message: `Your token ${token.token_number} is in position ${position.position}.`,
      type: "TOKEN_CREATED",
      related_id: token.id
    });
    await logActivity({ user_id: req.user.id, action: "CREATED_TOKEN", entity_type: "TOKEN", entity_id: token.id });
    res.status(201).json({ token, queue: position });
  } catch (error) {
    next(error);
  }
}

async function listTokens(req, res, next) {
  try {
    const tokens = await tokenModel.listTokens({
      userId: req.user.role === "USER" ? req.user.id : req.query.user_id,
      departmentId: req.query.department_id,
      status: req.query.status,
      todayOnly: req.query.today === "true"
    });
    res.json(tokens);
  } catch (error) {
    next(error);
  }
}

async function getPosition(req, res, next) {
  try {
    const position = await tokenModel.getQueuePosition(req.params.id);
    if (!position) return res.status(404).json({ message: "Token not found" });
    if (req.user.role === "USER" && position.token.user_id !== req.user.id) {
      return res.status(403).json({ message: "You cannot view this token" });
    }
    res.json(position);
  } catch (error) {
    next(error);
  }
}

async function callNext(req, res, next) {
  try {
    const token = await tokenModel.callNext(req.body.department_id);
    if (!token) return res.status(404).json({ message: "No waiting token found for this department" });

    await createNotification({
      user_id: token.user_id,
      title: "Token called",
      message: `${token.token_number} has been called at ${token.department_name}.`,
      type: "TOKEN_CALLED",
      related_id: token.id
    });
    const nextWaiting = await tokenModel.nextWaitingAfterCall(req.body.department_id);
    if (nextWaiting) {
      await createNotification({
        user_id: nextWaiting.user_id,
        title: "Token near",
        message: `${nextWaiting.token_number} is next in ${nextWaiting.department_name}.`,
        type: "TOKEN_NEAR",
        related_id: nextWaiting.id
      });
    }
    await logActivity({ user_id: req.user.id, action: "CALLED_NEXT_TOKEN", entity_type: "TOKEN", entity_id: token.id });
    res.json(token);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const status = req.body.status;
    const token = await tokenModel.updateStatus(req.params.id, status);
    if (!token) return res.status(404).json({ message: "Token not found" });

    const notificationTypes = {
      CALLED: "TOKEN_CALLED",
      COMPLETED: "TOKEN_COMPLETED",
      SKIPPED: "TOKEN_SKIPPED"
    };
    await createNotification({
      user_id: token.user_id,
      title: `Token ${status.toLowerCase()}`,
      message: `${token.token_number} is now ${status.toLowerCase()}.`,
      type: notificationTypes[status] || "TOKEN_UPDATED",
      related_id: token.id
    });
    await logActivity({ user_id: req.user.id, action: `TOKEN_${status}`, entity_type: "TOKEN", entity_id: token.id });
    res.json(token);
  } catch (error) {
    next(error);
  }
}

module.exports = { createToken, listTokens, getPosition, callNext, updateStatus };
