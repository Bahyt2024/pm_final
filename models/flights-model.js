const { Schema, model } = require('mongoose');

const flightSchema = new Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    price: { type: Number, required: true },
}, { timestamps: true });

module.exports = model('Flight', flightSchema);
