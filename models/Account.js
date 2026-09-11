const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        accountNumber: {
            type: String,
            unique: true,
            required: true
        },

        balance: {
            type: Number,
            default: 0
        },

        phone: {
            type: String,
            required: true
        },

        dateOfBirth: {
            type: Date,
            required: true
        },

        address: {
            type: String,
            required: true
        },

        city: {
            type: String,
            required: true
        },

        state: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Account", accountSchema);