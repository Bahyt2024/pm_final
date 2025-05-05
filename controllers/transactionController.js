
const AccountModel = require('../models/account-model');
const TransactionModel = require('../models/transaction-model');
const ApiError = require('../exceptions/api-error');

class TransactionController {
    // Осуществление перевода средств
    async transfer(req, res, next) {
        const { senderCardNumber, receiverCardNumber, amount } = req.body;

        if (!senderCardNumber || !receiverCardNumber || !amount) {
            return next(ApiError.BadRequest('Все поля (номер карты отправителя, номер карты получателя, сумма) обязательны'));
        }

        if (amount <= 0) {
            return next(ApiError.BadRequest('Сумма перевода должна быть положительной'));
        }

        try {
            // Находим аккаунты по номерам карт
            const senderAccount = await AccountModel.findOne({ cardNumber: senderCardNumber });
            const receiverAccount = await AccountModel.findOne({ cardNumber: receiverCardNumber });

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
            senderAccount.balance -= amount;
            receiverAccount.balance += amount;

            await senderAccount.save();
            await receiverAccount.save();

            const blockchainTransactionId = 'blockchain-id-' + Date.now();

            // Создаем транзакцию с использованием аккаунтов
            const transaction = await TransactionModel.create({
                senderAccount: senderAccount._id,
                receiverAccount: receiverAccount._id,
                amount,
                status: 'completed',
                blockchainTransactionId,
            });

            return res.json({ message: 'Перевод успешно выполнен', transaction });
        } catch (error) {
            console.error('Ошибка при выполнении перевода:', error);
            return next(ApiError.InternalServerError('Ошибка при выполнении перевода'));
        }
    }



    // Получение истории транзакций
    async getTransactions(req, res, next) {
        const userId = req.user.id;// Извлекаем userId из запроса, который добавлен middleware authMiddleWare

        console.log('User ID:', userId);  // Добавьте логирование

        try {
            // Ищем все аккаунты пользователя
            const userAccounts = await AccountModel.find({ userId });

            // Если аккаунты не найдены
            if (!userAccounts || userAccounts.length === 0) {
                return next(ApiError.NotFound('У пользователя нет аккаунтов'));
            }

            // Ищем транзакции, где senderAccount или receiverAccount принадлежат пользователю
            const transactions = await TransactionModel.find({
                $or: [
                    { senderAccount: { $in: userAccounts.map(acc => acc._id) } },
                    { receiverAccount: { $in: userAccounts.map(acc => acc._id) } }
                ]
            })
                .populate('senderAccount receiverAccount', 'accountNumber balance');  // Подключаем данные аккаунтов отправителя и получателя

            // Если транзакции не найдены
            if (transactions.length === 0) {
                return next(ApiError.NotFound('Нет транзакций для этого аккаунта'));
            }

            // Отправляем найденные транзакции в ответе
            return res.json({ transactions });
        } catch (error) {
            console.error('Ошибка при получении транзакций:', error);
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
    async cancelTransaction(req, res, next) {
        const { id } = req.params;  // Извлекаем ID транзакции из параметров запроса

        try {
            // Находим транзакцию по ID
            const transaction = await TransactionModel.findById(id);

            if (!transaction) {
                return next(ApiError.NotFound('Транзакция не найдена'));
            }

            // Проверяем, если транзакция уже завершена или отменена, то отменить нельзя
            if (transaction.status === 'completed' || transaction.status === 'failed') {
                return next(ApiError.BadRequest('Транзакция уже завершена или не может быть отменена'));
            }

            // Обновляем статус транзакции на "отменена"
            transaction.status = 'failed';  // Можно использовать "cancelled" или любой другой статус
            await transaction.save();

            // Отправляем ответ
            return res.json({ message: 'Транзакция успешно отменена', transaction });
        } catch (error) {
            console.error('Ошибка при отмене транзакции:', error);
            return next(ApiError.InternalServerError('Ошибка при отмене транзакции'));
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
    async getTransactionsByStatus(req, res, next) {
        const { status } = req.query; // Получаем статус из query-параметра

        try {
            const transactions = await TransactionModel.find({ status })
                .populate('senderAccount receiverAccount', 'accountNumber balance');
            if (transactions.length === 0) {
                return next(ApiError.NotFound('Нет транзакций с таким статусом'));
            }

            return res.json({ transactions });
        } catch (error) {
            console.error('Ошибка при получении транзакций по статусу:', error);
            return next(ApiError.InternalServerError('Ошибка при получении транзакций'));
        }
    }

}

module.exports = new TransactionController();
