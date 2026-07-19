import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    filename: {
      // filename on disk, under /uploads
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: "audio/webm",
    },
    duration: {
      // seconds
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    waveform: {
      // small array of amplitude samples (0-1) used to draw a thumbnail
      type: [Number],
      default: [],
    },
    linkedSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PracticeSession",
      default: null,
    },
  },
  { timestamps: true }
);

const Recording = mongoose.model("Recording", recordingSchema);
export default Recording;
