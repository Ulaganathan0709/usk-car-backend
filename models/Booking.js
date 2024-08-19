const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  days: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Cancelled', 'Failed'], default: 'Pending' },
  paymentIntentId: { type: String }, // For storing Stripe payment intent ID
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
