const AccountModel = require('../models/account-model');  // Модель аккаунта
const UserModel = require('../models/user-model');  // Модель пользователя
const ApiError = require('../exceptions/api-error');

class AccountController {
    // Создание нового аккаунта
    // Создание нового аккаунта
    async createAccount(req, res, next) {
        const { userId } = req.user;  // Получаем userId из токена
        const { accountType, initialDeposit } = req.body;  // Тип аккаунта и начальный депозит

        if (!accountType || !initialDeposit) {
            return next(ApiError.BadRequest('Тип аккаунта и начальный депозит обязательны'));
        }

        try {
            // Генерация уникального блока в "блокчейне" (симуляция)
            const blockchainAddress = await BlockchainService.generateWalletAddress(userId);

            // Создаем новый аккаунт
            const account = await AccountModel.create({
                user: userId,
                accountType,
                balance: initialDeposit,
                blockchainAddress,  // Сохраняем адрес блокчейн-кошелька
            });

            return res.json({ message: 'Аккаунт успешно создан', account });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при создании аккаунта'));
        }
    }


    // Получение информации об аккаунте
    async getAccount(req, res, next) {
        const { accountId } = req.params;  // ID аккаунта из параметров

        try {
            const account = await AccountModel.findById(accountId).populate('user', 'email firstName lastName');
            if (!account) {
                return next(ApiError.NotFound('Аккаунт не найден'));
            }

            return res.json({ account });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении аккаунта'));
        }
    }

    // Обновление информации об аккаунте (например, изменение типа аккаунта или баланса)
    async updateAccount(req, res, next) {
        const { accountId } = req.params;  // ID аккаунта из параметров
        const { accountType, balance } = req.body;  // Новые данные для обновления

        try {
            const account = await AccountModel.findById(accountId);

            if (!account) {
                return next(ApiError.NotFound('Аккаунт не найден'));
            }

            // Обновляем поля аккаунта
            if (accountType) account.accountType = accountType;
            if (balance !== undefined) account.balance = balance;

            await account.save();

            return res.json({ message: 'Аккаунт успешно обновлен', account });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при обновлении аккаунта'));
        }
    }

    // Получение всех аккаунтов пользователя
    async getAllAccounts(req, res, next) {
        const { userId } = req.user;  // Получаем userId из токена (передаётся через authMiddleware)

        try {
            const accounts = await AccountModel.find({ user: userId });

            if (accounts.length === 0) {
                return next(ApiError.NotFound('У пользователя нет аккаунтов'));
            }

            return res.json({ accounts });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении аккаунтов'));
        }
    }
}

module.exports = new AccountController();
