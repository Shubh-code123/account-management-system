const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        accountId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account"
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        senderAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            
        },
        receiverAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account"
        },

        type: {
            type: String,
            enum: ["deposit", "withdraw", "transfer"],
            required: true
        },

        amount: {
            type: Number,
            required: true
        },

        description: {
            type: String
        }
        
    },
    {
        timestamps: true
    }
    
);

module.exports = mongoose.model("Transaction", transactionSchema);