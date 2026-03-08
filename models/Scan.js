const mongoose = require("mongoose");

const ScanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    barcode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    result: {
      type: mongoose.Schema.Types.Mixed, // stores the full API response
      required: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Compound index for fast cache lookups
ScanSchema.index({ user: 1, barcode: 1 });

module.exports = mongoose.model("Scan", ScanSchema);
