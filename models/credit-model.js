const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },  // Сумма кредита
    interestRate: { type: Number, default: 5 }, // Процентная ставка
    status: { type: String, default: 'pending' }, // Статус кредита: ожидает, одобрен, отклонен
    approvalDate: { type: Date },
    repaymentDate: { type: Date },
    isPaid: { type: Boolean, default: false } // Статус погашения
});

module.exports = mongoose.model('Credit', creditSchema);
