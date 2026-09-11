const express = require("express");
const router = express.Router();

const { createAccount, getBalance , depositMoney, withdrawMoney, transferMoney,getAccountDetails, getTransfers, getTransactionHistory } = require("../controllers/accountController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, createAccount);
router.get("/balance", authMiddleware, getBalance);
router.post("/deposit", authMiddleware, depositMoney);
router.post("/withdrawMoney", authMiddleware, withdrawMoney);
router.post("/transfer", authMiddleware, transferMoney);
router.get("/transfers", authMiddleware, getTransfers);
router.get("/transactions", authMiddleware, getTransactionHistory);
router.get("/details", authMiddleware, getAccountDetails);

module.exports = router;