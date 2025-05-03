const mongoose = require('mongoose');
const { Schema } = mongoose;
const transactionSchema = new Schema({
    senderAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    receiverAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    blockchainTransactionId: { type: String, required: false }, // ID транзакции в блокчейне
    transactionDate: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Transaction', transactionSchema);
