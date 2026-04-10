const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/database");
require("dotenv").config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/goals", require("./routes/goals"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/users", require("./routes/users"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Oinky API is running" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Oinky server running on port ${PORT}`);
});

module.exports = app;
