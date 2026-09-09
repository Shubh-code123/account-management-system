const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Authorization header lo
        const authHeader = req.headers.authorization;

        console.log("AUTH HEADER:", authHeader);

        // 2. Header missing hai
        if (!authHeader) {
            return res.status(401).json({
                message: "Access token is required"
            });
        }

        // 3. Check karo Bearer format hai ya nahi
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }

        // 4. Token extract karo
        const token = authHeader.split(" ")[1];

        console.log("TOKEN RECEIVED:", !!token);

        if (!token) {
            return res.status(401).json({
                message: "Token is missing"
            });
        }

        // 5. JWT Secret check
        if (!process.env.JWT_SECRET) {
            console.log("JWT_SECRET is missing");

            return res.status(500).json({
                message: "JWT secret is not configured"
            });
        }

        // 6. JWT verify + decode
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("DECODED USER:", decoded);

        // 7. Database se user find karo
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        // 8. Check karo user active hai ya nahi
        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account has been deactivated"
            });
        }

        // 9. User information request mein store karo
        req.user = decoded;

        // 10. Next controller/route par jao
        next();

    } catch (error) {
        console.log("JWT ERROR:", error.message);

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authMiddleware;