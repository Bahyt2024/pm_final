const Flight = require('../models/flights-model');
const UserTicket = require('../models/userTickets-model');
const ApiError = require('../exceptions/api-error');
const mongoose = require('mongoose');
const AccountModel = require('../models/account-model');
class AviaticketController {
    // ✈️ Добавление рейса (только для админа)
    async addFlight(req, res, next) {
        try {
            const { from, to, departureTime, arrivalTime, price } = req.body;

            // Проверка наличия обязательных полей
            if (!from || !to || !departureTime || !arrivalTime || !price) {
                return next(ApiError.BadRequest('Все поля обязательны'));
            }

            // Проверка формата времени
            if (isNaN(Date.parse(departureTime)) || isNaN(Date.parse(arrivalTime))) {
                return next(ApiError.BadRequest('Неверный формат времени'));
            }

            // Проверка на положительную цену
            if (price <= 0) {
                return next(ApiError.BadRequest('Цена должна быть положительной'));
            }

            // Создание рейса
            const flight = await Flight.create({ from, to, departureTime, arrivalTime, price });

            // Возврат успешного ответа
            return res.status(201).json({ message: 'Рейс успешно добавлен', flight });
        } catch (error) {
            console.error('Ошибка при добавлении рейса:', error); // Логирование ошибки
            return next(ApiError.InternalServerError('Ошибка при добавлении рейса'));
        }
    }


    // ✈️ Получение всех доступных рейсов
    // ✈️ Получение всех доступных рейсов (с поиском)
    async getAvailableFlights(req, res, next) {
        try {
            const { from, to } = req.query;

            const filter = {};
            if (from) filter.from = new RegExp(from, 'i'); // нечувствительный к регистру поиск
            if (to) filter.to = new RegExp(to, 'i');

            const flights = await Flight.find(filter);
            return res.json(flights);
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении рейсов'));
        }
    }


    // ✈️ Покупка билета
    async purchaseTicket(req, res, next) {
        try {
            const { flightId, accountNumber } = req.body;
            const userId = req.user.id;

            if (!flightId || !accountNumber) {
                return next(ApiError.BadRequest('Не указаны flightId или accountNumber'));
            }

            const flight = await Flight.findById(flightId);
            if (!flight) {
                return next(ApiError.NotFound('Рейс не найден'));
            }

            const ticketPrice = flight.price;
            if (!ticketPrice || ticketPrice <= 0) {
                return next(ApiError.BadRequest('Некорректная стоимость билета'));
            }

            // Ищем аккаунт по номеру и userId
            const userAccount = await AccountModel.findOne({ accountNumber, userId });
            if (!userAccount) {
                return next(ApiError.NotFound('Аккаунт не найден или не принадлежит пользователю'));
            }

            if (userAccount.balance < ticketPrice) {
                return next(ApiError.BadRequest('Недостаточно средств на выбранном аккаунте'));
            }

            // Списываем средства
            userAccount.balance -= ticketPrice;
            await userAccount.save();

            // Создаем билет
            const ticket = await UserTicket.create({
                userId,
                flightId,
                status: 'confirmed',
                purchaseDate: new Date()
            });

            return res.status(201).json({ message: 'Билет успешно куплен', ticket });
        } catch (error) {
            console.error(error);
            return next(ApiError.InternalServerError('Ошибка при покупке билета: ' + error.message));
        }
    }




    // ✈️ Получение билетов текущего пользователя
    async getMyTickets(req, res, next) {
        try {
            const userId = req.user.id;

            const tickets = await UserTicket.find({ userId })
                .populate('flightId'); // подтягиваем рейс

            // Просто возвращаем результат (даже если пустой)
            return res.json(tickets);
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении билетов пользователя'));
        }
    }


    // ✈️ Отмена билета
    async cancelTicket(req, res, next) {
        try {
            const { ticketId } = req.params;
            const userId = req.user.id;

            const ticket = await UserTicket.findOne({ _id: ticketId, userId });

            if (!ticket) {
                return next(ApiError.NotFound('Билет не найден'));
            }

            if (ticket.status === 'cancelled') {
                return next(ApiError.BadRequest('Билет уже отменён'));
            }

            // Получаем стоимость билета
            const flight = await Flight.findById(ticket.flightId);
            const ticketPrice = flight ? flight.price : 0;

            if (!ticketPrice || ticketPrice <= 0) {
                return next(ApiError.BadRequest('Некорректная стоимость билета для возврата'));
            }

            // Находим аккаунт пользователя
            const userAccount = await AccountModel.findOne({ userId });

            if (!userAccount) {
                return next(ApiError.NotFound('Аккаунт пользователя не найден'));
            }

            // Возвращаем деньги на счет пользователя
            userAccount.balance += ticketPrice;
            await userAccount.save();

            // Создаём запись о возврате средств
            const transaction = await TransactionModel.create({
                senderAccount: null,  // Отсутствие отправителя, так как это возврат
                receiverAccount: userAccount._id,
                amount: ticketPrice,
                status: 'completed',
                blockchainTransactionId: 'blockchain-refund-id-' + Date.now(), // Симуляция ID возврата
            });

            // Отменяем билет
            ticket.status = 'cancelled';
            await ticket.save();

            return res.json({ message: 'Билет успешно отменён и средства возвращены', ticket, transaction });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при отмене билета и возврате средств'));
        }
    }

}

module.exports = new AviaticketController();
