const mongoose = require("mongoose");

const Feed = new mongoose.Schema({
  name: { type: String },
  url: { type: String },
});

const User = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    feed: [Feed],
  },
  {
    collection: "user-data",
  }
);

const model = mongoose.model("UserData", User);

module.exports = model;
