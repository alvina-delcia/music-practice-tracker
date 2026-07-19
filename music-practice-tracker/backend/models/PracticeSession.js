import mongoose from "mongoose";

const practiceSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    instrument: {
      type: String,
      required: [true, "Instrument is required"],
      trim: true,
      maxlength: 60,
    },
    duration: {
      // stored in minutes
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    practiceType: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    mood: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
  },
  { timestamps: true }
);

practiceSessionSchema.index({ user: 1, date: -1 });

const PracticeSession = mongoose.model("PracticeSession", practiceSessionSchema);
export default PracticeSession;
