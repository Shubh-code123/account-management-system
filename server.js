require("dotenv").config();

const express = require("express");
const cors = require("cors");

const rateLimiter = require("./middleware/rateLimiter");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const accountRoutes = require("./routes/accountRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// ================================
// CORS
// ================================

app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// ================================
// Middleware
// ================================

app.use(express.json());

// Rate limiter AFTER CORS
app.use(rateLimiter);

// ================================
// Connect MongoDB
// ================================

connectDB();

// ================================
// Test Route
// ================================

app.post("/test", (req, res) => {
    console.log(req.body);

    res.json({
        message: "Data received successfully",
        data: req.body,
    });
});

// ================================
// User Routes
// ================================

app.use("/api/users", userRoutes);

// ================================
// Account Routes
// ================================

app.use("/api/account", accountRoutes);

// ================================
// Admin Routes
// ================================

app.use("/api/admin", adminRoutes);

// ================================
// Home Route
// ================================

app.get("/", (req, res) => {
    res.send("Account Management API is running");
});

// ================================
// Start Server
// ================================

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});