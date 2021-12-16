const express = require("express");
const app = express();
const { parse } = require("rss-to-json");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/user.model");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");

app.use(cors());
app.use(express.json());

const connection = process.env.MONGO_CONNECTION_STRING;
mongoose
  .connect(connection)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log(err));

// Register new user
app.post("/api/register", async (req, res) => {
  try {
    const newPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      username: req.body.username,
      password: newPassword,
    });
    res.json({ status: "ok" });
  } catch (error) {
    res.json({ status: "error", error: "That username is already taken" });
  }
});

// Login existing user
app.post("/api/login", async (req, res) => {
  const user = await User.findOne({
    username: req.body.username,
  });

  if (!user) {
    return res.json({ status: "error", error: "Invalid login" });
  }

  const isPasswordValid = await bcrypt.compare(
    req.body.password,
    user.password
  );

  if (isPasswordValid) {
    const token = jwt.sign(
      {
        username: user.username,
      },
      process.env.JWT_SECRET
    );

    return res.json({ status: "ok", user: token });
  } else {
    return res.json({ status: "error", user: false });
  }
});

// Get Feed
app.get("/api/feed", async (req, res) => {
  const token = req.headers["x-access-token"];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const username = decoded.username;

    const user = await User.findOne({ username: username });

    return res.json({ status: "ok", feed: user.feed });
  } catch (error) {
    res.json({ status: "error", error: "invalid token" });
  }
});

// Add feed item
app.post("/api/item", async (req, res) => {
  const token = req.headers["x-access-token"];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const username = decoded.username;

    await User.updateOne(
      { username: username },
      { $set: { feed: req.body.feed } }
    );

    return res.json({ status: "ok" });
  } catch (error) {
    res.json({ status: "error", error: "invalid token" });
  }
});

// Delete feed item
app.post("/api/deleteitem", async (req, res) => {
  const token = req.headers["x-access-token"];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const username = decoded.username;

    await User.updateOne(
      { username: username },
      { $pull: { feed: { url: req.body.selectedUrl } } }
    );

    const user = await User.findOne({ username: username });

    return res.json({ status: "ok", feed: user.feed });
  } catch (error) {
    res.json({ status: "error", error: "invalid token" });
  }
});

// Parse the rss feed and send it to the client
app.post("/api/rssfeed", async (req, res) => {
  try {
    var rss = await parse(req.body.selectedUrl);

    res.json({ status: "ok", feed: rss });
  } catch (error) {
    res.json({ status: "error", error });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server started on port ${process.env.PORT}`);
});
