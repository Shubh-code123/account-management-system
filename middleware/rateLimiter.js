const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Maximum 100 requests
    message: {
        message: "Too many requests, please try again later."
    }
});

module.exports = rateLimiter;

