const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true 
  },
  paymentIntentId: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  last4: { 
    type: String, 
    required: false, // Only required for transactions involving a card
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Success', 'Failed', 'Refunded'], 
    default: 'Pending' 
  },
  paymentMethod: { 
    type: String, 
    enum: ['card'], 
    required: true 
  },
  reason: { 
    type: String 
  },
  note: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Middleware to update the updatedAt field
transactionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
