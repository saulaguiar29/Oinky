const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  plaidAccessToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
