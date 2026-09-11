const Account = require("../models/Account");
const generateAccountNumber = require("../utils/generateAccountNumber");
const Transaction = require("../models/Transaction");

// ================= CREATE ACCOUNT =================

const createAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      initialDeposit,
      phone,
      dateOfBirth,
      address,
      city,
      state,
    } = req.body;

    // Required fields validation
    if (
      !phone ||
      !dateOfBirth ||
      !address ||
      !city ||
      !state
    ) {
      return res.status(400).json({
        message: "All account details are required",
      });
    }

    // Initial deposit validation
    const deposit = Number(initialDeposit);

    if (isNaN(deposit) || deposit < 0) {
      return res.status(400).json({
        message: "Initial deposit must be a valid amount",
      });
    }

    // Check existing account
    const existingAccount = await Account.findOne({ userId });

    if (existingAccount) {
      return res.status(400).json({
        message: "Account already exists",
      });
    }

    // Generate unique account number
    const accountNumber = await generateAccountNumber();

    // Create account
    const account = await Account.create({
      userId,
      accountNumber,
      balance: deposit,
      phone,
      dateOfBirth,
      address,
      city,
      state,
    });

    // Create initial deposit transaction
    if (deposit > 0) {
      await Transaction.create({
        userId,
        accountId: account._id,
        type: "deposit",
        amount: deposit,
        description: "Initial deposit",
      });
    }

    res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create account",
      error: error.message,
    });
  }
};

// ================= GET BALANCE =================

const getBalance = async (req, res) => {
  try {
    const userId = req.user.userId;

    const account = await Account.findOne({ userId });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.json({
      message: "Balance fetched successfully",
      balance: account.balance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch balance",
      error: error.message,
    });
  }
};

// ================= DEPOSIT MONEY =================

const depositMoney = async (req, res) => {
  try {
    const { amount } = req.body;

    const depositAmount = Number(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const account = await Account.findOne({
      userId: req.user.userId,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    // Increase balance
    account.balance += depositAmount;
    await account.save();

    // Create transaction
    await Transaction.create({
      userId: req.user.userId,
      accountId: account._id,
      type: "deposit",
      amount: depositAmount,
      description: "Money deposited",
    });

    res.json({
      message: "Money deposited successfully",
      balance: account.balance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to deposit money",
      error: error.message,
    });
  }
};

// ================= WITHDRAW MONEY =================

const withdrawMoney = async (req, res) => {
  try {
    const { amount } = req.body;

    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    const account = await Account.findOne({
      userId: req.user.userId,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    // Balance check
    if (account.balance < withdrawAmount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // Decrease balance
    account.balance -= withdrawAmount;
    await account.save();

    // Create transaction
    await Transaction.create({
      userId: req.user.userId,
      accountId: account._id,
      type: "withdraw",
      amount: withdrawAmount,
      description: "Money withdrawn",
    });

    res.json({
      message: "Money withdrawn successfully",
      balance: account.balance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to withdraw money",
      error: error.message,
    });
  }
};

// ================= TRANSFER MONEY =================

const transferMoney = async (req, res) => {
  try {
    const { receiverAccountNumber, amount } = req.body;

    const transferAmount = Number(amount);

    // Validation
    if (
      !receiverAccountNumber ||
      isNaN(transferAmount) ||
      transferAmount <= 0
    ) {
      return res.status(400).json({
        message: "Receiver account number and valid amount are required",
      });
    }

    // Sender account
    const senderAccount = await Account.findOne({
      userId: req.user.userId,
    });

    if (!senderAccount) {
      return res.status(404).json({
        message: "Sender account not found",
      });
    }

    // Receiver account
    const receiverAccount = await Account.findOne({
      accountNumber: receiverAccountNumber,
    });

    if (!receiverAccount) {
      return res.status(404).json({
        message: "Receiver account not found",
      });
    }

    // Same account check
    if (
      senderAccount._id.toString() === receiverAccount._id.toString()
    ) {
      return res.status(400).json({
        message: "Cannot transfer to your own account",
      });
    }

    // Balance check
    if (senderAccount.balance < transferAmount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // Update sender balance
    await Account.updateOne(
      { _id: senderAccount._id },
      { $inc: { balance: -transferAmount } }
    );

    // Update receiver balance
    await Account.updateOne(
      { _id: receiverAccount._id },
      { $inc: { balance: transferAmount } }
    );

    // Sender transaction
    await Transaction.create({
      userId: senderAccount.userId,
      accountId: senderAccount._id,
      senderAccount: senderAccount._id,
      receiverAccount: receiverAccount._id,
      type: "transfer",
      amount: transferAmount,
      description: `Transferred to ${receiverAccountNumber}`,
    });

    // Receiver transaction
    await Transaction.create({
      userId: receiverAccount.userId,
      accountId: receiverAccount._id,
      senderAccount: senderAccount._id,
      receiverAccount: receiverAccount._id,
      type: "transfer",
      amount: transferAmount,
      description: `Received from ${senderAccount.accountNumber}`,
    });

    // Get updated sender balance
    const updatedSenderAccount = await Account.findById(
      senderAccount._id
    );

    res.json({
      message: "Money transferred successfully",
      balance: updatedSenderAccount.balance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to transfer money",
      error: error.message,
    });
  }
};

// ================= GET TRANSFERS =================

const getTransfers = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.userId,
      type: "transfer",
    })
      .populate({
        path: "senderAccount",
        populate: {
          path: "userId",
          select: "fullName",
        },
      })
      .populate({
        path: "receiverAccount",
        populate: {
          path: "userId",
          select: "fullName",
        },
      })
      .sort({ createdAt: -1 });

    const transfers = transactions.map((transaction) => ({
      transactionId: transaction._id,

      amount: transaction.amount,

      sender: {
        name: transaction.senderAccount?.userId?.fullName,
        accountNumber: transaction.senderAccount?.accountNumber,
      },

      receiver: {
        name: transaction.receiverAccount?.userId?.fullName,
        accountNumber: transaction.receiverAccount?.accountNumber,
      },

      type: transaction.type,

      createdAt: transaction.createdAt,
    }));

    res.json({
      message: "Transfer history fetched successfully",
      transfers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transfer history",
      error: error.message,
    });
  }
};

// ================= TRANSACTION HISTORY =================

// ================= TRANSACTION HISTORY =================

const getTransactionHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    const { type, startDate, endDate } = req.query;

    const filter = {
      userId: req.user.userId,
    };

    // Filter by transaction type
    if (type) {
      filter.type = type;
    }

    // Filter by date
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const transactions = await Transaction.find(filter)
      .populate("senderAccount", "accountNumber")
      .populate("receiverAccount", "accountNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTransactions = await Transaction.countDocuments(filter);

    res.json({
      message: "Transaction history fetched successfully",
      page,
      limit,
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / limit),
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transaction history",
      error: error.message,
    });
  }
};
// ================= GET ACCOUNT DETAILS =================

const getAccountDetails = async (req, res) => {
  try {
    const userId = req.user.userId;

    const account = await Account.findOne({ userId }).populate(
      "userId",
      "fullName email"
    );

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.json({
      message: "Account details fetched successfully",
      account,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch account details",
      error: error.message,
    });
  }
};

// ================= EXPORT =================

module.exports = {
  createAccount,
  getAccountDetails,
  getBalance,
  depositMoney,
  withdrawMoney,
  transferMoney,
  getTransfers,
  getTransactionHistory,
};