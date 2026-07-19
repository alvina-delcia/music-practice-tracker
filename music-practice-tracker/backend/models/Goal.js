import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one active goal document per user
    },
    type: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },
    targetMinutes: {
      type: Number,
      required: true,
      min: [1, "Target must be at least 1 minute"],
      default: 30,
    },
  },
  { timestamps: true }
);

const Goal = mongoose.model("Goal", goalSchema);
export default Goal;
