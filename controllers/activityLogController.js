const { listLogs } = require("../models/activityLogModel");

async function listActivityLogs(req, res, next) {
  try {
    res.json(await listLogs({ limit: req.query.limit || 100 }));
  } catch (error) {
    next(error);
  }
}

module.exports = { listActivityLogs };
