const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ error: true, message: "Phone already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phone,
      password: hashed,
      role: null, // 👈 IMPORTANT
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ error: true, message: "User not found" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ error: true, message: "Invalid password" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// ✅ UPDATE ROLE (THIS WAS MISSING)
router.put("/update-role", async (req, res) => {
  try {
    const { userId, role } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

module.exports = router;
