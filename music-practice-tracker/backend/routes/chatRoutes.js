import express from "express";
import PracticeSession from "../models/PracticeSession.js";
import Goal from "../models/Goal.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

const CADENCE_SYSTEM_PROMPT = `You are Cadence, a warm, encouraging AI practice buddy built into a music practice tracking app called Cadence.
Your job is to help the user reflect on their practice, stay motivated, and get quick answers about their own logged data.

Personality:
- Warm, upbeat, a little playful — like a supportive practice buddy, not a generic assistant.
- Keep replies SHORT: 2-4 sentences max, unless the user clearly wants more detail.
- Use at most one music-related emoji per reply (🎵 🎻 🎸 🎹 🔥), never more.
- You can see a short summary of the user's real practice data below — use it naturally when relevant, but don't force it into every reply.
- If asked something outside music practice/tracking (e.g. general trivia, coding help, unrelated topics), gently redirect back to practice-related help.
- You cannot add, edit, or delete sessions yourself — if the user asks you to log a session, tell them to use the "+ Add session" button, you're here to chat and advise, not take actions.
- Never make up specific numbers that aren't in the data summary given to you.`;

// @route   POST /api/chat
// @desc    Send a message to Cadence (OpenAI-powered practice assistant)
router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Please include a message" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        message: "Cadence isn't configured yet — missing OPENAI_API_KEY on the server.",
      });
    }

    // Pull a small, real summary of the user's data so Cadence can ground her replies
    const [recentSessions, goal, allSessions] = await Promise.all([
      PracticeSession.find({ user: req.user._id }).sort({ date: -1 }).limit(5),
      Goal.findOne({ user: req.user._id }),
      PracticeSession.find({ user: req.user._id }),
    ]);

    const totalMinutes = allSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = allSessions.length;

    const recentSummary = recentSessions
      .map((s) => `${new Date(s.date).toLocaleDateString()} - ${s.instrument}, ${s.duration} min`)
      .join("; ");

    const contextBlock = `
User's practice data summary:
- Name: ${req.user.name}
- Total sessions logged: ${totalSessions}
- Total practice time: ${totalMinutes} minutes
- Current goal: ${goal ? `${goal.targetMinutes} minutes ${goal.type}` : "no goal set yet"}
- Most recent sessions: ${recentSummary || "none logged yet"}
`.trim();

    // Keep only the last few turns to control cost/latency
    const trimmedHistory = Array.isArray(history) ? history.slice(-8) : [];

    const messages = [
      { role: "system", content: `${CADENCE_SYSTEM_PROMPT}\n\n${contextBlock}` },
      ...trimmedHistory.map((turn) => ({
        role: turn.role === "assistant" ? "assistant" : "user",
        content: turn.text,
      })),
      { role: "user", content: message.trim() },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", errText);
      return res.status(502).json({ message: "Cadence had trouble responding. Try again in a moment." });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I didn't quite catch that — could you try again?";

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: "Failed to reach Cadence", error: error.message });
  }
});

export default router;
