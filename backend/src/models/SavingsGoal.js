const mongoose = require("mongoose");

const SavingsGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true, min: 0 },
  currentAmount: { type: Number, default: 0 },
  // currentAmount = SUM(deposits) - SUM(withdrawals), updated on every transaction
  imageUrl: { type: String, default: null },
  productUrl: { type: String, default: null }, // link to the actual product (Taylor's feedback)
  deadline: { type: Date },
  savingPlan: {
    type: String,
    enum: ["daily", "weekly", "monthly"],
    default: "monthly",
  },
  status: {
    type: String,
    enum: ["active", "completed", "cancelled"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SavingsGoal", SavingsGoalSchema);
