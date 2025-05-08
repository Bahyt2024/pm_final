const mongoose = require('mongoose');
const { Schema } = mongoose;

const accountSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountNumber: {
        type: String,
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'KZT','GBP', 'JPY','RUB'],
        default: 'USD'
    },

    // Карточные данные:
    cardNumber: {
        type: String,
        required: true,
        unique: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    cvv: {
        type: String,
        required: true
    },
    cardType: {
        type: String,
        enum: ['Debit', 'Credit'],
        required: true
    },

    // Статус кредита (для ML): 'approved' или 'denied'
    creditStatus: {
        type: String,
        enum: ['approved', 'denied'],
        default: 'denied'
    },

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Account', accountSchema);
