require("dotenv").config();

const express = require("express");
const rateLimiter = require("./middleware/rateLimiter");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const accountRoutes = require("./routes/accountRoutes");
const adminRoutes = require("./routes/adminRoutes");


const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(rateLimiter);

// Connect MongoDB
connectDB();

// Test POST route
app.post("/test", (req, res) => {
    console.log(req.body);

    res.json({
        message: "Data received successfully",
        data: req.body
    });
});

// User routes
app.use("/api/users", userRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/admin", adminRoutes);


// Home route
app.get("/", (req, res) => {
    res.send("Account Management API is running");
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});