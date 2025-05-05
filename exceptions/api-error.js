module.exports = class ApiError extends Error{
    status;
    errors;

    constructor(status,message,errors){
        super(message);
        this.status = status;
        this.errors = errors
    }
    static NotFound(message) {
        return new ApiError(404, message);
    }
    static UnauthoraizedError(){
        return new ApiError(404, 'Пользователь не авторизован');

    }
    static BadRequest(message,errors = []){
        return new ApiError(400, message,errors)
    }
    static ForbiddenError(message,errors = []){
        return new ApiError(400, message,errors)
    }
    static InternalServerError(message = 'Внутренняя ошибка сервера', errors = []) {
        return new ApiError(500, message, errors);
    }
}