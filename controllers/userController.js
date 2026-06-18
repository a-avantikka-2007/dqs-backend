const userModel = require("../models/userModel");
const { logActivity } = require("../models/activityLogModel");

async function listUsers(req, res, next) {
  try {
    const users = await userModel.listUsers({ role: req.query.role, search: req.query.search });
    res.json(users);
  } catch (error) {
    next(error);
  }
}

async function createOperator(req, res, next) {
  try {
    const existing = await userModel.findByEmail(req.body.email);
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const operator = await userModel.createUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      role: "STAFF_OPERATOR",
      status: "ACTIVE"
    });
    await logActivity({
      user_id: req.user.id,
      action: "CREATED_OPERATOR",
      entity_type: "USER",
      entity_id: operator.id
    });
    res.status(201).json(operator);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    if (Number(req.params.id) === req.user.id && req.body.status && req.body.status !== "ACTIVE") {
      return res.status(400).json({ message: "You cannot disable your own account" });
    }

    const updated = await userModel.updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "User not found" });

    await logActivity({ user_id: req.user.id, action: "UPDATED_USER", entity_type: "USER", entity_id: updated.id });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await userModel.deleteUser(req.params.id);
    await logActivity({ user_id: req.user.id, action: "DELETED_USER", entity_type: "USER", entity_id: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { listUsers, createOperator, updateUser, deleteUser };
