const mongoose = require('mongoose');
const { Schema } = mongoose;
const accountSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'U ser', required: true },
    accountNumber: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, enum: ['USD', 'EUR', 'KZT'], default: 'USD' },
    blockchainAddress: { type: String, required: false }, // Адрес в блокчейне
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Account', accountSchema);
