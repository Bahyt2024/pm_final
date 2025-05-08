const { Schema, model, Types } = require('mongoose');

const userTicketSchema = new Schema({
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    flightId: { type: Types.ObjectId, ref: 'Flight', required: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    purchaseDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = model('UserTicket', userTicketSchema);
