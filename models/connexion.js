const mongoose = require("mongoose");
const connexSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const LogInCollection = new mongoose.model("LogInCollection", connexSchema);

module.exports = LogInCollection;
