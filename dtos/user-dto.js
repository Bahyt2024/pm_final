module.exports = class UserDto {
    email;
    id;
    firstName;
    lastName;
    role;
    isActivated;
    activationLink;
    createdAt;
    updatedAt;

    constructor(model) {
        this.email = model.email;
        this.id = model._id;
        this.firstName = model.firstName;
        this.lastName = model.lastName;
        this.role = model.role;
        this.isActivated = model.activated;
        this.activationLink = model.activationLink;
        this.createdAt = model.createdAt;
        this.updatedAt = model.updatedAt;
    }
};
