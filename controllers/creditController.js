const CreditModel = require('../models/credit-model'); // Модель кредита
const ApiError = require('../exceptions/api-error'); // Обработчик ошибок
const AIController = require('./AiController'); // Подключаем AIController
const TransactionModel = require('../models/transaction-model');
const AccountModel = require('../models/account-model');
class CreditController {
    // Создание кредита
    async createCredit(req, res, next) {
        const { amount, interestRate } = req.body;
        const userId = req.user.id;
        const userAccounts = await AccountModel.find({ userId }).select('_id');
        const accountIds = userAccounts.map(account => account._id);
        if (!amount || amount <= 0) {
            return next(ApiError.BadRequest('Сумма кредита должна быть положительной'));
        }

        try {
            // Получаем решение от AIController
            const totalIncome = await TransactionModel.aggregate([
                {
                    $match: {
                        senderAccount: { $in: accountIds },
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);
            if (totalIncome<125000) {
                const aiDecision = await AIController.getLoanApproval(req, res, next);
                if (!aiDecision || !aiDecision.status) {
                    throw new Error('AI-решение недоступно');
                }

                if (aiDecision.status === 'denied') {
                    return res.json({ message: aiDecision.message });
                }

                // Кредит одобрен — создаём запись
                const credit = await CreditModel.create({
                    userId,
                    amount,
                    interestRate,
                    status: 'approved'
                });

                return res.json({ message: aiDecision.message, credit });
            }
            const credit = await CreditModel.create({
                userId,
                amount,
                interestRate,
                status: 'approved'
            });
            return res.json({ message: "Одобрен", credit });
        } catch (err) {
            console.error('CreditController.createCredit error:', err);
            return next(ApiError.InternalServerError('Ошибка при создании кредита'));
        }
    }

    // Получение кредита по ID
    async getCredit(req, res, next) {
        const { creditId } = req.params;

        try {
            const credit = await CreditModel.findById(creditId);
            if (!credit) {
                return next(ApiError.NotFound('Кредит не найден'));
            }

            return res.json(credit);
        } catch (error) {
            console.error('Ошибка при получении кредита:', error);
            return next(ApiError.InternalServerError('Ошибка при получении кредита'));
        }
    }

    // Обновление информации о кредите
    async updateCredit(req, res, next) {
        const { creditId } = req.params;
        const { status, repaymentDate, isPaid } = req.body;

        try {
            const credit = await CreditModel.findById(creditId);
            if (!credit) {
                return next(ApiError.NotFound('Кредит не найден'));
            }

            // Обновляем информацию о кредите
            credit.status = status || credit.status;
            credit.repaymentDate = repaymentDate || credit.repaymentDate;
            credit.isPaid = isPaid !== undefined ? isPaid : credit.isPaid;

            await credit.save();

            return res.json({ message: 'Информация о кредите обновлена', credit });
        } catch (error) {
            console.error('Ошибка при обновлении кредита:', error);
            return next(ApiError.InternalServerError('Ошибка при обновлении кредита'));
        }
    }

    // Получение всех кредитов пользователя
    async getAllCredits(req, res, next) {
        const userId = req.user.id; // Получаем ID пользователя из middleware

        try {
            const credits = await CreditModel.find({ userId });
            return res.json(credits);
        } catch (error) {
            console.error('Ошибка при получении всех кредитов:', error);
            return next(ApiError.InternalServerError('Ошибка при получении всех кредитов'));
        }
    }
}

module.exports = new CreditController();
