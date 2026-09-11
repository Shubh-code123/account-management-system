const User = require("../models/User");
const Account = require("../models/Account");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER USER =================

const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Check required fields
        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "All required fields must be provided"
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role: role || "user"
        });

        // Send response
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
};


// ================= LOGIN USER =================

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        // Send response
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};


// ================= GET PROFILE =================

const getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find user
        const user = await User.findById(userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Find account of this user
        const account = await Account.findOne({ userId });

        res.status(200).json({
            message: "Profile fetched successfully",
            user,
            account
        });

    } catch (error) {
        console.log("Get Profile Error:", error);

        res.status(500).json({
            message: "Failed to fetch profile",
            error: error.message
        });
    }
};


// ================= UPDATE PROFILE =================

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const {
            fullName,
            phone,
            dateOfBirth,
            address,
            city,
            state,
            profilePhoto
        } = req.body;

        // Find user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Update user details
        if (fullName) {
            user.fullName = fullName;
        }

        if (profilePhoto !== undefined) {
            user.profilePhoto = profilePhoto;
        }

        await user.save();

        // Find account
        const account = await Account.findOne({ userId });

        if (account) {

            if (phone) {
                account.phone = phone;
            }

            if (dateOfBirth) {
                account.dateOfBirth = dateOfBirth;
            }

            if (address) {
                account.address = address;
            }

            if (city) {
                account.city = city;
            }

            if (state) {
                account.state = state;
            }

            await account.save();
        }

        // Get updated data
        const updatedUser = await User.findById(userId)
            .select("-password");

        const updatedAccount = await Account.findOne({ userId });

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
            account: updatedAccount
        });

    } catch (error) {
        console.log("Update Profile Error:", error);

        res.status(500).json({
            message: "Failed to update profile",
            error: error.message
        });
    }
};


// ================= EXPORT =================

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile
};