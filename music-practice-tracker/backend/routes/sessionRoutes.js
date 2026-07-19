import express from "express";
import PracticeSession from "../models/PracticeSession.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes below require authentication
router.use(protect);

// @route   GET /api/sessions
// @desc    Get all sessions for logged in user, optional ?date=YYYY-MM-DD or ?search=
router.get("/", async (req, res) => {
  try {
    const { date, search } = req.query;
    const filter = { user: req.user._id };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    if (search) {
      filter.$or = [
        { instrument: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const sessions = await PracticeSession.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch sessions", error: error.message });
  }
});

// @route   GET /api/sessions/stats
// @desc    Aggregate stats for dashboard (total minutes, today, this week, recent sessions)
router.get("/stats", async (req, res) => {
  try {
    const userId = req.user._id;

    const allSessions = await PracticeSession.find({ user: userId });
    const totalMinutes = allSessions.reduce((sum, s) => sum + s.duration, 0);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);

    const todayMinutes = allSessions
      .filter((s) => s.date >= startOfToday && s.date <= endOfToday)
      .reduce((sum, s) => sum + s.duration, 0);

    const dayOfWeek = now.getDay(); // 0 = Sunday
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekMinutes = allSessions
      .filter((s) => s.date >= startOfWeek && s.date <= endOfWeek)
      .reduce((sum, s) => sum + s.duration, 0);

    const recentSessions = await PracticeSession.find({ user: userId })
      .sort({ date: -1, createdAt: -1 })
      .limit(5);

    res.json({
      totalMinutes,
      todayMinutes,
      weekMinutes,
      totalSessions: allSessions.length,
      recentSessions,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
});

// @route   GET /api/sessions/:id
router.get("/:id", async (req, res) => {
  try {
    const session = await PracticeSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch session", error: error.message });
  }
});

// @route   POST /api/sessions
// @desc    Create a new practice session
router.post("/", async (req, res) => {
  try {
    const { date, instrument, duration, notes, practiceType, tags, rating, mood } = req.body;

    if (!date || !instrument || !duration) {
      return res.status(400).json({ message: "Date, instrument, and duration are required" });
    }

    const session = await PracticeSession.create({
      user: req.user._id,
      date,
      instrument,
      duration,
      notes,
      practiceType,
      tags,
      rating,
      mood,
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: "Failed to create session", error: error.message });
  }
});

// @route   PUT /api/sessions/:id
// @desc    Update a practice session
router.put("/:id", async (req, res) => {
  try {
    const { date, instrument, duration, notes, practiceType, tags, rating, mood } = req.body;

    const session = await PracticeSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { date, instrument, duration, notes, practiceType, tags, rating, mood },
      { new: true, runValidators: true }
    );

    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: "Failed to update session", error: error.message });
  }
});

// @route   DELETE /api/sessions/:id
router.delete("/:id", async (req, res) => {
  try {
    const session = await PracticeSession.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json({ message: "Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete session", error: error.message });
  }
});

export default router;
