const User = require("../models/User");
const Account = require("../models/Account");

const getAllUsers = async (req, res) => {
    try {

        const users = await User.find({role:"user"})
            .select("-password");

        const usersWithAccounts = await Promise.all(
            users.map(async (user) => {

                const account = await Account.findOne({
                    userId: user._id
                });

                return {
                    ...user.toObject(),
                    accountNumber: account?.accountNumber || null,
                    balance: account?.balance || 0
                };
            })
        );

        res.json({
            message: "All users fetched successfully",
            users: usersWithAccounts
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch users",
            error: error.message
        });
    }
};

const changeUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({
            _id: userId,
            role: "user"
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        user.isActive = !user.isActive;

        await user.save();

        res.json({
            message: user.isActive
                ? "User reactivated successfully"
                : "User deactivated successfully",

        
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to change user status",
            error: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    changeUserStatus
};