const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment, refundPayment } = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// Route to create a payment intent
router.post('/create-payment-intent', protect, createPaymentIntent);

// Route to confirm a payment and update transaction status
router.post('/confirm-payment', protect, confirmPayment);

// Route to refund a payment and create a refund transaction
router.post('/refund-payment', protect, refundPayment);

module.exports = router;
