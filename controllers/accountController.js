const AccountModel = require('../models/account-model');
const UserModel = require('../models/user-model');
const ApiError = require('../exceptions/api-error');

// Функции генерации
function generateAccountNumber() {
    return 'AC' + Math.floor(100000000000 + Math.random() * 900000000000); // 12-значный номер с префиксом
}

function generateCardNumber() {
    return '4' + Math.floor(100000000000000 + Math.random() * 900000000000000); // 16-значный номер Visa
}

function generateCVV() {
    return Math.floor(100 + Math.random() * 900).toString(); // 3 цифры
}

function generateExpiryDate() {
    const now = new Date();
    return new Date(now.setFullYear(now.getFullYear() + 4)); // +4 года
}

class AccountController {
    async createAccount(req, res, next) {
        const userId = req.user.id; // исправлено

        const { initialDeposit, currency, cardType = 'debit' } = req.body;

        if (initialDeposit === undefined) {
            return next(ApiError.BadRequest('Начальный депозит обязателен'));
        }

        try {
            const account = await AccountModel.create({
                userId,
                accountNumber: generateAccountNumber(),
                cardNumber: generateCardNumber(),
                cvv: generateCVV(),
                expiryDate: generateExpiryDate(),
                cardType,
                currency: currency || 'USD',
                balance: initialDeposit
            });

            return res.json({ message: 'Аккаунт (карта) успешно создан', account });
        } catch (error) {
            console.error(error);
            return next(ApiError.InternalServerError('Ошибка при создании аккаунта'));
        }
    }


    // Остальные методы без изменений
    async getAccount(req, res, next) {
        const { accountId } = req.params;
        try {
            const account = await AccountModel.findById(accountId).populate('userId', 'email firstName lastName');
            if (!account) return next(ApiError.NotFound('Аккаунт не найден'));
            return res.json({ account });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении аккаунта'));
        }
    }

    async updateAccount(req, res, next) {
        const { accountId } = req.params;
        const { balance } = req.body;

        try {
            const account = await AccountModel.findById(accountId);
            if (!account) return next(ApiError.NotFound('Аккаунт не найден'));

            if (balance !== undefined) account.balance = balance;
            account.updatedAt = new Date();

            await account.save();
            return res.json({ message: 'Аккаунт успешно обновлен', account });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при обновлении аккаунта'));
        }
    }

    async getAllAccounts(req, res, next) {
        const userId = req.user.id;  // Получаем id пользователя

        try {
            const accounts = await AccountModel.find({ userId });
            if (accounts.length === 0) {
                return next(ApiError.NotFound('У пользователя нет аккаунтов'));
            }
            return res.json({ accounts });
        } catch (error) {
            console.error('Ошибка при получении аккаунтов:', error);  // Логируем ошибку для отладки
            return next(ApiError.InternalServerError('Ошибка при получении аккаунтов'));
        }
    }

}

module.exports = new AccountController();
