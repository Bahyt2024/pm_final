const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const MailService = require('./mail-service')
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')
const userModel = require('../models/user-model')
class UserService{
    async registration(email, password, firstName, lastName, role = 'client') {
        const candidate = await UserModel.findOne({ email });
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} уже существует`);
        }

        // Хеширование пароля
        const hashPassword = await bcrypt.hash(password, 3);
        const activationLink = uuid.v4();

        // Создание нового пользователя
        const user = await UserModel.create({
            email,
            password: hashPassword,
            firstName,  // Добавляем имя
            lastName,   // Добавляем фамилию
            role,
            activationLink,
        });

        // Отправка письма для активации
        await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

        // Создание DTO для пользователя
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        return {
            ...tokens,
            user: userDto
        };
    }

    async activate(activationLink){
        const user = await UserModel.findOne({activationLink})
        if(!user){
           throw ApiError.BadRequest('некорректная ссылка активаций')
        }   
        user.isActivated = true
        await user.save()
   }
   async login(email,password){
        const user = await userModel.findOne({email})
        if(!user){
            throw ApiError.BadRequest('Пользователь с таким email не найден')

        }
        const isPassEquals =  await bcrypt.compare(password,user.password);
        if(!isPassEquals){
            throw ApiError.BadRequest('Неверный пароль')
        }
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({...userDto})

        await tokenService.saveToken(userDto.id, tokens.refreshToken)
        return{
           ...tokens,
           user: userDto
       }
   }
   async logout(refreshToken){
    const token = await tokenService.removeToken(refreshToken);
    return token

   }
   async refresh(refreshToken){
    if(!refreshToken){
        throw ApiError.UnauthorizedError()
    }
    const UserData = tokenService.validateRefreshToken(refreshToken)
    const tokenFromDb = await tokenService.tokenFromDb(refreshToken)
    if(!UserData || !tokenFromDb){
        throw ApiError.UnauthorizedError()
    }
    const user = await userModel.findById(UserData.id)
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({...userDto})

    await tokenService.saveToken(userDto.id, tokens.refreshToken)
    return{
       ...tokens,
       user: userDto
   }
   }


   async getAllUsers(){
    const users = await userModel.find()
    return users
   }
} 

module.exports = new UserService()