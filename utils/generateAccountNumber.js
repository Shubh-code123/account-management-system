const Account = require("../models/Account");

const generateAccountNumber = async () => {
    let accountNumber;
    let exists = true;

    while (exists) {
        accountNumber = Math.floor(
            1000000000 + Math.random() * 9000000000
        ).toString();

        exists = await Account.findOne({ accountNumber });
    }

    return accountNumber;
};

module.exports = generateAccountNumber;