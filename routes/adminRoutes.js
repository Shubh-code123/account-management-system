const express = require("express");

const router = express.Router();

const {
  getAllUsers,
  changeUserStatus
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);

router.put(
  "/users/:userId/change-status",
  authMiddleware,
  adminMiddleware,
  changeUserStatus
);

module.exports = router;