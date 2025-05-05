const TransactionModel = require('../models/transaction-model');
const AccountModel = require('../models/account-model');
const ApiError = require('../exceptions/api-error');
const ReportModel = require('../models/report-model');

class ReportController {
    // Получение отчета о транзакциях
    async getTransactionsReport(req, res, next) {
        const { startDate, endDate } = req.query;  // Даты начала и конца для фильтрации транзакций

        try {
            let filter = {};

            if (startDate) {
                filter.createdAt = { $gte: new Date(startDate) };
            }

            if (endDate) {
                if (!filter.createdAt) filter.createdAt = {};
                filter.createdAt.$lte = new Date(endDate);
            }

            const transactions = await TransactionModel.find(filter)
                .populate('senderAccount receiverAccount', 'email accountType');

            if (transactions.length === 0) {
                return next(ApiError.NotFound('Нет транзакций для данного периода'));
            }

            return res.json({ transactions });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении отчета о транзакциях'));
        }
    }

    // Получение финансового сводного отчета
    async getFinancialSummary(req, res, next) {
        try {
            const totalIncome = await TransactionModel.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const totalExpenses = await TransactionModel.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const income = totalIncome[0] ? totalIncome[0].total : 0;
            const expenses = totalExpenses[0] ? totalExpenses[0].total : 0;

            // Проверка на наличие userId — обязательно!
            if (!req.user || !req.user.id) {
                return next(ApiError.BadRequest('Необходим userId для сохранения отчета'));
            }

            // Сохраняем отчет
            await ReportModel.create({
                userId: req.user.id,               // <-- пользователь
                type: 'monthly',                   // <-- можешь изменить при необходимости
                category: 'financial-summary',     // <-- произвольная категория
                totalSpending: expenses,
                totalIncome: income,
                reportDate: new Date()
            });

            return res.json({
                totalIncome: income,
                totalExpenses: expenses
            });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении финансового отчета'));
        }
    }

    // Получение отчета о блокчейне
    async getBlockchainReport(req, res, next) {
        const { startDate, endDate } = req.query;  // Даты для фильтрации по блокчейн транзакциям

        try {
            let filter = {};

            if (startDate) {
                filter.createdAt = { $gte: new Date(startDate) };
            }

            if (endDate) {
                if (!filter.createdAt) filter.createdAt = {};
                filter.createdAt.$lte = new Date(endDate);
            }

            const blockchainTransactions = await TransactionModel.find(filter)
                .select('blockchainTransactionId createdAt amount')  // Возвращаем только нужные поля
                .sort({ createdAt: -1 });  // Сортировка по дате

            if (blockchainTransactions.length === 0) {
                return next(ApiError.NotFound('Нет блокчейн транзакций для данного периода'));
            }

            return res.json({ blockchainTransactions });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении отчета о блокчейне'));
        }
    }
}

module.exports = new ReportController();
