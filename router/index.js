const Router = require('express').Router;
const userController = require('../controllers/user-controller');
const accountController = require('../controllers/accountController');
const transactionController = require('../controllers/transactionController');
const reportController = require('../controllers/reportController');
const CreditsController = require('../controllers/creditController');
const { body } = require('express-validator');
const authMiddleWare = require('../middlewares/auth-middleware');
const roleMiddleware = require('../middlewares/roleMiddleware'); // Проверка ролей
const AviaticketController = require('../controllers/aviaTickerController');
const router = new Router();

// 🟢 Аутентификация
router.post('/registration',
    body('email').isEmail(),
    body('password').isLength({ min: 3, max: 32 }),
    body('firstName').isLength({ min: 1 }),
    body('lastName').isLength({ min: 1 }),
    userController.registration
);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);
router.get('/users', authMiddleWare, roleMiddleware(['admin']), userController.getUsers);
//


router.post('/aviatickets/flight/add', authMiddleWare, roleMiddleware(['admin']), AviaticketController.addFlight);

// ✈️ Все доступные рейсы
router.get('/aviatickets/flights', authMiddleWare, AviaticketController.getAvailableFlights);

// ✈️ Покупка билета
router.post('/aviatickets/purchase', authMiddleWare, AviaticketController.purchaseTicket);

// ✈️ Билеты текущего пользователя
router.get('/aviatickets/my', authMiddleWare, AviaticketController.getMyTickets);

// ✈️ Отмена билета
router.delete('/aviatickets/:ticketId/cancel', authMiddleWare, AviaticketController.cancelTicket);



// 🟢 Аккаунты
router.post('/account/create', authMiddleWare, accountController.createAccount);
router.get('/account/:accountId', authMiddleWare, accountController.getAccount);
router.patch('/account/:accountId/update', authMiddleWare, accountController.updateAccount);
router.get('/accounts', authMiddleWare, accountController.getAllAccounts);

router.post('/credit/create', authMiddleWare, CreditsController.createCredit); // Создание кредита
router.get('/credit/:creditId', authMiddleWare, CreditsController.getCredit); // Получение кредита по ID
router.patch('/credit/:creditId/update', authMiddleWare, CreditsController.updateCredit); // Обновление кредита
router.get('/credits', authMiddleWare, CreditsController.getAllCredits); // Получение всех кредитов для пользователя

// 🟢 Транзакции
router.post('/transaction/transfer', authMiddleWare, transactionController.transfer);

// Получение транзакции по ID
router.get('/transaction/:transactionId', authMiddleWare, transactionController.getTransactionById);

// Получение всех транзакций для пользователя
router.get('/transactions', authMiddleWare, transactionController.getTransactions);
router.delete('/transaction/:id/cancel', authMiddleWare, transactionController.cancelTransaction);

// 🟢 Блокчейн

// 🟢 Интеграция с ИИ
// router.post('/ai/recommendations', authMiddleWare, aiController.getRecommendations);
// router.post('/ai/loan-approval', authMiddleWare, aiController.getLoanApproval);

// 🟢 Отчеты
router.get('/report/transactions', authMiddleWare, reportController.getTransactionsReport);
router.get('/report/financial-summary', authMiddleWare, reportController.getFinancialSummary);
router.get('/report/blockchain', authMiddleWare, reportController.getBlockchainReport);
// Маршрут для отмены транзакции
// router.delete('/transaction/:id/cancel', authMiddleWare, transactionController.cancelTransaction);

// 🟢 Администрирование
router.post('/admin/block-user', authMiddleWare, roleMiddleware(['admin']), userController.blockUser);
router.post('/admin/unblock-user', authMiddleWare, roleMiddleware(['admin']), userController.unblockUser);
router.get('/admin/users', authMiddleWare, roleMiddleware(['admin']), userController.getAllUsers);
router.post('/admin/set-role', authMiddleWare, roleMiddleware(['admin']), userController.setRole);

// 🟢 Платежи
router.post('/payment/pay', authMiddleWare, transactionController.pay);
router.get('/payment/history', authMiddleWare, transactionController.getPaymentHistory);







module.exports = router;
