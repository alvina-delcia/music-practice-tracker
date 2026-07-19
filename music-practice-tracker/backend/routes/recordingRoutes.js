import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Recording from "../models/Recording.js";
import { protect } from "../middleware/authMiddleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = file.originalname?.split(".").pop() || "webm";
    cb(null, `${req.user._id}-${Date.now()}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per recording
});

const router = express.Router();

router.use(protect);

// @route   GET /api/recordings
router.get("/", async (req, res) => {
  try {
    const recordings = await Recording.find({ user: req.user._id })
      .populate("linkedSession", "instrument date")
      .sort({ date: -1, createdAt: -1 });
    res.json(recordings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recordings", error: error.message });
  }
});

// @route   POST /api/recordings
// @desc    Upload a new recording (multipart/form-data)
router.post("/", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file was uploaded" });
    }

    const { title, duration, notes, tags, linkedSession, waveform } = req.body;

    if (!title || !duration) {
      return res.status(400).json({ message: "Title and duration are required" });
    }

    let parsedTags = [];
    try {
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch {
      parsedTags = [];
    }

    let parsedWaveform = [];
    try {
      parsedWaveform = waveform ? JSON.parse(waveform) : [];
    } catch {
      parsedWaveform = [];
    }

    const recording = await Recording.create({
      user: req.user._id,
      title,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      duration: Number(duration),
      notes: notes || "",
      tags: parsedTags,
      waveform: parsedWaveform,
      linkedSession: linkedSession || null,
    });

    res.status(201).json(recording);
  } catch (error) {
    res.status(500).json({ message: "Failed to save recording", error: error.message });
  }
});

// @route   PUT /api/recordings/:id
// @desc    Rename or update notes/tags/linked session (does not replace the audio file)
router.put("/:id", async (req, res) => {
  try {
    const { title, notes, tags, linkedSession } = req.body;

    const update = {};
    if (title !== undefined) update.title = title;
    if (notes !== undefined) update.notes = notes;
    if (tags !== undefined) update.tags = tags;
    if (linkedSession !== undefined) update.linkedSession = linkedSession || null;

    const recording = await Recording.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      update,
      { new: true, runValidators: true }
    ).populate("linkedSession", "instrument date");

    if (!recording) return res.status(404).json({ message: "Recording not found" });
    res.json(recording);
  } catch (error) {
    res.status(500).json({ message: "Failed to update recording", error: error.message });
  }
});

// @route   DELETE /api/recordings/:id
router.delete("/:id", async (req, res) => {
  try {
    const recording = await Recording.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!recording) return res.status(404).json({ message: "Recording not found" });

    const filePath = path.join(uploadsDir, recording.filename);
    fs.unlink(filePath, () => {}); // best-effort cleanup, ignore errors

    res.json({ message: "Recording deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete recording", error: error.message });
  }
});

export default router;
