const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: String,

  role: {
    type: String,
    enum: ["FARMER", "VENDOR", "COMMUNITY"],
    default: null,
  },

  location: String,
});

module.exports = mongoose.model("User", userSchema);
