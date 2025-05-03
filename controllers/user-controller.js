const e = require("express");
const userService = require("../service/user-service");
const {validationResult} = require('express-validator')
const ApiError = require('../exceptions/api-error')


class UserController{
    async registration(req,res,next){
        try {
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                next(ApiError.BadRequest('Ошибка при валидаций',errors.array()))
            }
            const {email,password} = req.body;
            const UserData = await userService.registration(email,password)
            res.cookie('refreshToken', UserData.refreshToken, {maxAge: 30*24*60*60*1000, httpOnly: true})
            return res.json(UserData)
            
        } catch (e) {
            next(e)
            
        }
    }
    async login(req,res,next){
        try {
            const {email,password} = req.body
            const userData = await userService.login(email,password)
            res.cookie('refreshToken', userData.refreshToken, {maxAge: 30*24*60*60*1000, httpOnly: true})
            return res.json(userData)
        } catch (e) {
            next(e)
            
        }
    }
    async logout(req,res,next){
        try {
            const {refreshToken} = req.cookies;
            const token = await userService.logout(refreshToken)
            res.clearCookie('refreshToken')
            return res.json(token)
        } catch (e) {
            next(e)
            
        }
    }
    async activate(req,res,next){
        try {
            const activationLink = req.params.link
            await userService.activate(activationLink);
            return res.redirect(process.env.CLIENT_URL);

        } catch (e) {
            next(e)
            
        }
    }
    async refresh(req,res,next){
        try {
            const {refreshToken} = req.cookies()
            const UserData = await userService.refresh(refreshToken)
            res.cookie('refreshToken', UserData.refreshToken, {maxAge: 30*24*60*60*1000, httpOnly: true})
            return res.json(UserData)
        } catch (e) {
            next(e)
            
        }
    }
    async getUsers(req,res,next){
        try {
            const users = await userService.getAllUsers()
            res.json(users)
        } catch (e) {
            next(e)
            
        }
    }
    async blockUser(req, res, next) {
        const { userId } = req.body;

        if (!userId) {
            return next(ApiError.BadRequest('Не указан ID пользователя'));
        }

        try {
            const user = await UserModel.findById(userId);

            if (!user) {
                return next(ApiError.NotFound('Пользователь не найден'));
            }

            user.isBlocked = true;  // Устанавливаем флаг блокировки

            await user.save();  // Сохраняем изменения в базе данных

            return res.json({ message: 'Пользователь заблокирован успешно' });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при блокировке пользователя'));
        }
    }

    // Разблокировка пользователя
    async unblockUser(req, res, next) {
        const { userId } = req.body;

        if (!userId) {
            return next(ApiError.BadRequest('Не указан ID пользователя'));
        }

        try {
            const user = await UserModel.findById(userId);

            if (!user) {
                return next(ApiError.NotFound('Пользователь не найден'));
            }

            user.isBlocked = false;  // Снимаем блокировку

            await user.save();  // Сохраняем изменения в базе данных

            return res.json({ message: 'Пользователь разблокирован успешно' });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при разблокировке пользователя'));
        }
    }

    // Получение всех пользователей
    async getAllUsers(req, res, next) {
        try {
            const users = await UserModel.find();  // Получаем всех пользователей

            return res.json({ users });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при получении списка пользователей'));
        }
    }

    // Изменение роли пользователя
    async setRole(req, res, next) {
        const { userId, role } = req.body;

        if (!userId || !role) {
            return next(ApiError.BadRequest('Не указан ID пользователя или роль'));
        }

        try {
            const user = await UserModel.findById(userId);

            if (!user) {
                return next(ApiError.NotFound('Пользователь не найден'));
            }

            user.role = role;  // Устанавливаем новую роль пользователю

            await user.save();  // Сохраняем изменения в базе данных

            return res.json({ message: 'Роль пользователя изменена успешно' });
        } catch (error) {
            return next(ApiError.InternalServerError('Ошибка при изменении роли пользователя'));
        }
    }
}

module.exports = new UserController()