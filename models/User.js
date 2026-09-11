const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },


    password: {
        type: String,
        required: true
    },
     profilePhoto: {
      type: String,
      default: "",
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    
    isActive: {
        type: Boolean,
        default: true
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;