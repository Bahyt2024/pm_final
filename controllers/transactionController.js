const TransactionModel = require('../models/transaction-model');
const AccountModel = require('../models/account-model');
const ApiError = require('../exceptions/api-error');

class TransactionController {
    // Осуществление перевода средств
    async transfer(req, res, next) {
        const { senderAccountId, receiverAccountId, amount } = req.body;  // Получаем данные о переводе из тела запроса

        if (!senderAccountId || !receiverAccountId || !amount) {
            return next(ApiError.BadRequest('Все поля (отправитель, получатель, сумма) обязательны'));
        }

        if (amount <= 0) {
            return next(ApiError.BadRequest('Сумма перевода должна быть положительной'));
        }

        try {
            const senderAccount = await AccountModel.findById(senderAccountId);
            const receiverAccount = await AccountModel.findById(receiverAccountId);

            if (!senderAccount) {
                return next(ApiError.NotFound('Аккаунт отправителя не найден'));
            }

            if (!receiverAccount) {
                return next(ApiError.NotFound('Аккаунт получателя не найден'));
            }

            if (senderAccount.balance < amount) {
                return next(ApiError.BadRequest('Недостаточно средств на счету отправителя'));
            }

            // Выполняем перевод
            senderAccount.balance -= amount;  // Списываем средства с аккаунта отправителя
            receiverAccount.balance += amount;  // Зачисляем средства на аккаунт получателя

            await senderAccount.save();
            await receiverAccount.save();

            // Создаем запись о транзакции в блокчейне (симуляция)
            const blockchainTransactionId = 'blockchain-id-' + Date.now();  // Симуляция ID транзакции в блокчейне

            // Создаем запись о транзакции
            const transaction = await TransactionModel.create({
                senderAccount: senderAccountId,
                receiverAccount: receiverAccountId,
                amount,
                status: 'completed',  // Статус транзакции изменен на "завершена"
                blockchainTransactionId,  // Добавляем ID транзакции в блокчейне
            });

            return res.json({ message: 'Перевод успешно выполнен', transaction });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при выполнении перевода'));
        }
    }

    // Получение истории транзакций
    async getTransactions(req, res, next) {
        const { accountId } = req.params;  // ID аккаунта из параметров

        try {
            const transactions = await TransactionModel.find({
                $or: [{ senderAccount: accountId }, { receiverAccount: accountId }]  // Находим транзакции по отправителю или получателю
            }).populate('senderAccount receiverAccount', 'email accountType');  // Подключаем данные аккаунтов отправителя и получателя

            if (transactions.length === 0) {
                return next(ApiError.NotFound('Нет транзакций для этого аккаунта'));
            }

            return res.json({ transactions });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении транзакций'));
        }
    }

    // Получение транзакции по ID
    async getTransactionById(req, res, next) {
        const { transactionId } = req.params;  // ID транзакции из параметров

        try {
            const transaction = await TransactionModel.findById(transactionId)
                .populate('senderAccount receiverAccount', 'email accountType');

            if (!transaction) {
                return next(ApiError.NotFound('Транзакция не найдена'));
            }

            return res.json({ transaction });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении транзакции'));
        }
    }

    // Осуществление оплаты
    async pay(req, res, next) {
        const { senderAccountId, amount } = req.body;  // Получаем данные о платеже из тела запроса

        if (!senderAccountId || !amount) {
            return next(ApiError.BadRequest('Все поля (аккаунт отправителя и сумма) обязательны'));
        }

        if (amount <= 0) {
            return next(ApiError.BadRequest('Сумма платежа должна быть положительной'));
        }

        try {
            const senderAccount = await AccountModel.findById(senderAccountId);

            if (!senderAccount) {
                return next(ApiError.NotFound('Аккаунт отправителя не найден'));
            }

            if (senderAccount.balance < amount) {
                return next(ApiError.BadRequest('Недостаточно средств на счету отправителя'));
            }

            // Выполняем оплату
            senderAccount.balance -= amount;

            await senderAccount.save();

            // Создаем запись о платеже
            const transaction = await TransactionModel.create({
                senderAccount: senderAccountId,
                receiverAccount: null, // Для оплаты, получателя нет
                amount,
                status: 'completed',
                blockchainTransactionId: 'blockchain-id-' + Date.now(),  // Симуляция ID транзакции в блокчейне
            });

            return res.json({ message: 'Оплата успешно выполнена', transaction });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при выполнении оплаты'));
        }
    }

    // Получение истории оплат
    async getPaymentHistory(req, res, next) {
        const { accountId } = req.params;  // ID аккаунта из параметров

        try {
            const transactions = await TransactionModel.find({
                senderAccount: accountId,
                receiverAccount: null,  // Только оплаты, где получатель не указан
            }).populate('senderAccount', 'email accountType');

            if (transactions.length === 0) {
                return next(ApiError.NotFound('Нет оплат для этого аккаунта'));
            }

            return res.json({ transactions });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении истории оплат'));
        }
    }
}

module.exports = new TransactionController();
