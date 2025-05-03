const ApiError = require('../exceptions/api-error');
const tokenService = require('../service/token-service')

module.exports = function (roles) {
    return function (req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return next(ApiError.UnauthoraizedError());
            }

            const token = authHeader.split(' ')[1]; // Bearer <token>
            if (!token) {
                return next(ApiError.UnauthoraizedError());
            }

            const userData = tokenService.validateAccessToken(token);
            if (!userData) {
                return next(ApiError.UnauthoraizedError());
            }

            // Проверяем, есть ли у пользователя хотя бы одна из требуемых ролей
            if (!roles.includes(userData.role)) {
                return next(ApiError.ForbiddenError('У вас нет доступа'));
            }

            req.user = userData;
            next();
        } catch (error) {
            return next(ApiError.UnauthoraizedError());
        }
    };
};
