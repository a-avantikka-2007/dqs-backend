const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const userModel = require("../models/userModel");
const { logActivity } = require("../models/activityLogModel");

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

async function register(req, res, next) {
  try {
    const existing = await userModel.findByEmail(req.body.email);
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const user = await userModel.createUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      role: "USER"
    });
    await logActivity({ user_id: user.id, action: "REGISTERED", entity_type: "USER", entity_id: user.id });

    res.status(201).json({ user, token: signToken(user) });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const fullUser = await userModel.findByEmail(req.body.email);
    if (!fullUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(req.body.password, fullUser.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (fullUser.status !== "ACTIVE") {
      return res.status(403).json({ message: "This account is not active" });
    }

    const user = userModel.sanitize(fullUser);
    await logActivity({ user_id: user.id, action: "LOGGED_IN", entity_type: "USER", entity_id: user.id });
    res.json({ user, token: signToken(user) });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };
