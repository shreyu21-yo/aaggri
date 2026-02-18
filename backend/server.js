const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/agriconnect")
  .then(() => console.log("MongoDB connected"));

app.use("/api/auth", require("./routes/auth"));


app.listen(5000, () => console.log("Server running on 5000"));
