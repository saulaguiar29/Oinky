const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const User = require("../models/User");

/**
 * GET /api/users/profile
 * Get the current user's profile.
 */
router.get("/profile", protect, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/users/profile
 * Update the current user's display name.
 */
router.patch("/profile", protect, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true },
    );
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
