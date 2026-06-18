const departmentModel = require("../models/departmentModel");
const { logActivity } = require("../models/activityLogModel");

async function listDepartments(req, res, next) {
  try {
    const departments = await departmentModel.listDepartments({ activeOnly: req.query.active === "true" });
    res.json(departments);
  } catch (error) {
    next(error);
  }
}

async function createDepartment(req, res, next) {
  try {
    const department = await departmentModel.createDepartment(req.body);
    await logActivity({
      user_id: req.user.id,
      action: "CREATED_DEPARTMENT",
      entity_type: "DEPARTMENT",
      entity_id: department.id
    });
    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
}

async function updateDepartment(req, res, next) {
  try {
    const department = await departmentModel.updateDepartment(req.params.id, req.body);
    if (!department) return res.status(404).json({ message: "Department not found" });

    await logActivity({
      user_id: req.user.id,
      action: "UPDATED_DEPARTMENT",
      entity_type: "DEPARTMENT",
      entity_id: department.id
    });
    res.json(department);
  } catch (error) {
    next(error);
  }
}

async function deleteDepartment(req, res, next) {
  try {
    await departmentModel.deleteDepartment(req.params.id);
    await logActivity({
      user_id: req.user.id,
      action: "DELETED_DEPARTMENT",
      entity_type: "DEPARTMENT",
      entity_id: req.params.id
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
