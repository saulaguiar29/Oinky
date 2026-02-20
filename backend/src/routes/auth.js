const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");

/**
 * POST /api/auth/sync
 * Called right after Firebase login to ensure the user exists in MongoDB.
 * The protect middleware handles creation automatically on first login.
 */
router.post("/sync", protect, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
router.get("/me", protect, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
