const AIModel           = require('../AI/AiModel');
const TransactionModel  = require('../models/transaction-model');
const AccountModel      = require('../models/account-model');
const ApiError          = require('../exceptions/api-error');

class AIController {
    /**
     * Возвращает { status, message }
     */
    async getLoanApproval(req, res, next) {
        const userId = req.user.id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return next(ApiError.BadRequest('Сумма кредита должна быть положительной'));
        }

        try {
            if (!AIModel.isTrained()) {
                await AIModel.trainModel();
            }

            const user = await AccountModel.findOne({ userId });
            if (!user) {
                return next(ApiError.NotFound('Пользователь не найден'));
            }

            const txs = await TransactionModel.find({ userId, status: 'completed' });
            const successfulTransactions = txs.length;
            const averageBalance = user.balance;

            const prediction = AIModel.predict(successfulTransactions, averageBalance);
            const status     = prediction === 1 ? 'approved' : 'denied';
            const message    = prediction === 1 ? 'Кредит одобрен' : 'Кредит отклонен';

            // Возвращаем объект, а не res.json
            return { status, message };
        } catch (err) {
            console.error('AIController.getLoanApproval error:', err);
            return next(ApiError.InternalServerError('Ошибка при принятии решения о кредите'));
        }
    }
}

module.exports = new AIController();
