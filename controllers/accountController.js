const Account = require("../models/Account");
const generateAccountNumber = require("../utils/generateAccountNumber");
const Transaction = require("../models/Transaction");

const createAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const existingAccount = await Account.findOne({ userId });

    if (existingAccount) {
      return res.status(400).json({
        message: "Account already exists",
      });
    }

    const accountNumber = await generateAccountNumber();

    const account = await Account.create({
      userId,
      accountNumber,
      balance: 0,
    });

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

const depositMoney = async (req, res) => {
  try {
    const { amount } = req.body;

    // Amount validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0",
      });
    }

    // User ka account find karo
    const account = await Account.findOne({
      userId: req.user.userId,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    // Balance increase
    account.balance += amount;
    await account.save();

    // Transaction record
    await Transaction.create({
      userId: req.user.userId,
      accountId: account._id,
      type: "deposit",
      amount: amount,
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

const withdrawMoney = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
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

    if (account.balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    account.balance -= amount;
    await account.save();

    await Transaction.create({
      userId: req.user.userId,
      accountId: account._id,
      type: "withdraw",
      amount: amount,
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
const transferMoney = async (req, res) => {
  try {
    const { receiverAccountNumber, amount } = req.body;

    if (!receiverAccountNumber || !amount || amount <= 0) {
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
    if (senderAccount._id.toString() === receiverAccount._id.toString()) {
      return res.status(400).json({
        message: "Cannot transfer to your own account",
      });
    }

    // Balance check
    if (senderAccount.balance < amount) {
      return res.status(400).json({
        message: "Insufficient balance",
      });
    }

    // Money transfer
    senderAccount.balance -= amount;
    receiverAccount.balance += amount;

    await senderAccount.save();
    await receiverAccount.save();

    // Sender transaction
    await Transaction.create({
      userId: req.user.userId,
      senderAccount: senderAccount._id,
      receiverAccount: receiverAccount._id,
      type: "transfer",
      amount: amount,
      description: `Transferred to ${receiverAccountNumber}`,
    });

    // Receiver transaction
    await Transaction.create({
      userId: receiverAccount.userId,
      senderAccount: senderAccount._id,
      receiverAccount: receiverAccount._id,
      type: "transfer",
      amount: amount,
      description: `Received from ${senderAccount.accountNumber}`,
    });

    res.json({
      message: "Money transferred successfully",
      balance: senderAccount.balance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to transfer money",
      error: error.message,
    });
  }
};
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      message: "Transaction history fetched successfully",
      page,
      limit,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transaction history",
      error: error.message,
    });
  }
};


module.exports = {
  createAccount,
  getBalance,
  depositMoney,
  withdrawMoney,
  transferMoney,
  getTransfers,
  getTransactionHistory,
};
