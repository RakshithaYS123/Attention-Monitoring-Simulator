const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attentiveTime: {
      type: Number, // in seconds
      required: true,
      default: 0,
    },
    distractedTime: {
      type: Number, // in seconds
      required: true,
      default: 0,
    },
    attentionSwitches: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDuration: {
      type: Number, // in seconds
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", SessionSchema);
