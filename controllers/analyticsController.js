const analyticsModel = require("../models/analyticsModel");

async function summary(req, res, next) {
  try {
    res.json(await analyticsModel.getSummary());
  } catch (error) {
    next(error);
  }
}

async function traffic(req, res, next) {
  try {
    res.json(await analyticsModel.departmentTraffic());
  } catch (error) {
    next(error);
  }
}

async function trends(req, res, next) {
  try {
    const [peak_hours, weekly_trends, monthly_trends] = await Promise.all([
      analyticsModel.peakHours(),
      analyticsModel.weeklyTrends(),
      analyticsModel.monthlyTrends()
    ]);
    res.json({ peak_hours, weekly_trends, monthly_trends });
  } catch (error) {
    next(error);
  }
}

async function crowd(req, res, next) {
  try {
    res.json(await analyticsModel.crowdPrediction(req.query.department_id || null));
  } catch (error) {
    next(error);
  }
}

module.exports = { summary, traffic, trends, crowd };
