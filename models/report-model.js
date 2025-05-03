const mongoose = require('mongoose');
const { Schema } = mongoose;
const reportSchema = new Schema({


    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'U ser',
        required: true
    },
    type: {
        type: String,
        enum: ['monthly', 'quarterly', 'annual'],
        required: true
    },
    category: {
        type: String,
        required: true
    },
    totalSpending: {
        type: Number,
        default: 0
    },
    totalIncome: {
        type: Number,
        default: 0
    },
    reportDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', reportSchema);
