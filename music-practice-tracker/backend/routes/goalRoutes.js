import express from "express";
import Goal from "../models/Goal.js";
import PracticeSession from "../models/PracticeSession.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// @route   GET /api/goals
// @desc    Get current goal + progress for logged in user
router.get("/", async (req, res) => {
  try {
    let goal = await Goal.findOne({ user: req.user._id });

    if (!goal) {
      // Create a sensible default goal on first visit
      goal = await Goal.create({ user: req.user._id, type: "daily", targetMinutes: 30 });
    }

    const now = new Date();
    let rangeStart, rangeEnd;

    if (goal.type === "daily") {
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      rangeEnd = new Date(rangeStart);
      rangeEnd.setHours(23, 59, 59, 999);
    } else {
      const dayOfWeek = now.getDay();
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeStart.getDate() + 6);
      rangeEnd.setHours(23, 59, 59, 999);
    }

    const sessions = await PracticeSession.find({
      user: req.user._id,
      date: { $gte: rangeStart, $lte: rangeEnd },
    });

    const progressMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const progressPercent = Math.min(100, Math.round((progressMinutes / goal.targetMinutes) * 100));

    res.json({
      _id: goal._id,
      type: goal.type,
      targetMinutes: goal.targetMinutes,
      progressMinutes,
      progressPercent,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch goal", error: error.message });
  }
});

// @route   PUT /api/goals
// @desc    Create or update the user's goal
router.put("/", async (req, res) => {
  try {
    const { type, targetMinutes } = req.body;

    if (!type || !targetMinutes) {
      return res.status(400).json({ message: "Type and target minutes are required" });
    }

    if (!["daily", "weekly"].includes(type)) {
      return res.status(400).json({ message: "Type must be 'daily' or 'weekly'" });
    }

    const goal = await Goal.findOneAndUpdate(
      { user: req.user._id },
      { type, targetMinutes },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: "Failed to update goal", error: error.message });
  }
});

export default router;
