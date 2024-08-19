const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a PaymentIntent or retrieve an existing one
exports.createPaymentIntent = async (req, res) => {
  const { amount, bookingId } = req.body;

  try {
    if (!amount || !bookingId) {
      throw new Error("Amount and bookingId are required.");
    }

    // Check if the booking already has a paymentIntentId
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
      throw new Error("Booking not found.");
    }

    // Reuse existing payment intent if it exists
    if (existingBooking.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(existingBooking.paymentIntentId);
      return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    }

    // Create a new PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in paise (smallest currency unit for INR)
      currency: 'inr',
      payment_method_types: ['card'],
      metadata: { bookingId: bookingId.toString() },
    });

    // Update the booking with the new paymentIntentId
    existingBooking.paymentIntentId = paymentIntent.id;
    await existingBooking.save();

    // Update the transaction status as "Pending"
    const transaction = await Transaction.findOneAndUpdate(
      { bookingId },
      { paymentIntentId: paymentIntent.id, status: 'Pending' },
      { new: true }
    );

    console.log('Transaction updated successfully:', transaction);

    // Respond with the client secret
    res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Error in createPaymentIntent:', error.message);
    res.status(500).json({ error: error.message });
  }
};



// Create a PaymentIntent or retrieve an existing one
exports.createPaymentIntent = async (req, res) => {
  const { amount, bookingId } = req.body;

  try {
    if (!amount || !bookingId) {
      throw new Error("Amount and bookingId are required.");
    }

    // Check if the booking already has a paymentIntentId
    const existingBooking = await Booking.findById(bookingId);
    if (!existingBooking) {
      throw new Error("Booking not found.");
    }

    // Reuse existing payment intent if it exists
    if (existingBooking.paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(existingBooking.paymentIntentId);
      return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    }

    // Create a new PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in paise (smallest currency unit for INR)
      currency: 'inr',
      payment_method_types: ['card'],
      metadata: { bookingId: bookingId.toString() },
    });

    // Update the booking with the new paymentIntentId
    existingBooking.paymentIntentId = paymentIntent.id;
    await existingBooking.save();

    // Update the transaction status as "Pending"
    const transaction = await Transaction.findOneAndUpdate(
      { bookingId },
      { paymentIntentId: paymentIntent.id, status: 'Pending' },
      { new: true }
    );

    console.log('Transaction updated successfully:', transaction);

    // Respond with the client secret
    res.status(200).json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Error in createPaymentIntent:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Handle payment confirmation and update transaction status with a note
exports.confirmPayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    // Retrieve the PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Log the payment intent status for debugging
    console.log("Payment Intent Status:", paymentIntent.status);

    let transactionStatus = '';
    let bookingStatus = '';
    let note = '';

    if (paymentIntent.status === 'succeeded') {
      // Payment succeeded
      transactionStatus = 'Success';
      bookingStatus = 'Paid';
      note = 'Payment succeeded';
    } else {
      return res.status(400).json({ message: 'Unexpected payment status', paymentIntent });
    }

    // Update the transaction status
    const transaction = await Transaction.findOneAndUpdate(
      { paymentIntentId },
      { status: transactionStatus, note: note },
      { new: true }
    );

    if (!transaction) {
      throw new Error('Transaction not found.');
    }

    // Update the booking status
    const booking = await Booking.findOneAndUpdate(
      { paymentIntentId },
      { status: bookingStatus },
      { new: true }
    );

    if (!booking) {
      throw new Error('Booking not found.');
    }

    console.log('Payment confirmation. Transaction and booking updated:', transaction, booking);

    res.status(200).json({ message: `Payment ${transactionStatus.toLowerCase()}`, transaction, booking });

  } catch (error) {
    console.error('Error in confirmPayment:', error.message);

    // Handle specific error scenarios, focusing on 402 errors
    if (error.type === 'StripeInvalidRequestError' && error.statusCode === 402) {
      // This handles the 402 Payment Required error
      const note = error.message || 'Payment failed due to insufficient funds or invalid payment method';

      // Update the transaction and booking to reflect the failure
      const transaction = await Transaction.findOneAndUpdate(
        { paymentIntentId },
        { status: 'Failed', note: note },
        { new: true }
      );

      const booking = await Booking.findOneAndUpdate(
        { paymentIntentId },
        { status: 'Cancelled' },
        { new: true }
      );

      console.log('Payment failed with 402 error. Transaction and booking updated:', transaction, booking);

      return res.status(402).json({ error: 'Payment failed', message: note, transaction, booking });
    }

    res.status(500).json({ error: error.message });
  }
};

// Handle refund requests and update transaction status with a note
exports.refundPayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Create a refund with Stripe
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      // Find the original transaction
      const originalTransaction = await Transaction.findOne({ paymentIntentId });

      // Create a new transaction specifically for the refund
      const refundTransaction = await Transaction.create({
        bookingId: originalTransaction.bookingId,
        paymentIntentId: refund.id, // Use refund ID as the paymentIntentId for the refund transaction
        amount: originalTransaction.amount,
        status: 'Refunded',
        paymentMethod: originalTransaction.paymentMethod,
        reason: 'User cancelled',
        note: 'Refund processed successfully',
      });

      // Update the booking status to "Cancelled"
      const booking = await Booking.findOneAndUpdate(
        { _id: originalTransaction.bookingId },
        { status: 'Cancelled' },
        { new: true }
      );

      console.log('Refund successful. New transaction and booking updated:', refundTransaction, booking);

      res.status(200).json({ message: 'Refund successful', refund, refundTransaction, booking });

    } else {
      res.status(400).json({ message: 'Payment not successful. Refund not possible.' });
    }
  } catch (error) {
    console.error('Error in refundPayment:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Handle refund requests and update transaction status with a note
exports.refundPayment = async (req, res) => {
  const { paymentIntentId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Create a refund with Stripe
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      // Find the original transaction
      const originalTransaction = await Transaction.findOne({ paymentIntentId });

      // Create a new transaction specifically for the refund
      const refundTransaction = await Transaction.create({
        bookingId: originalTransaction.bookingId,
        paymentIntentId: refund.id, // Use refund ID as the paymentIntentId for the refund transaction
        amount: originalTransaction.amount,
        status: 'Refunded',
        paymentMethod: originalTransaction.paymentMethod,
        reason: 'User cancelled',
        note: 'Refund processed successfully',
      });

      // Update the booking status to "Cancelled"
      const booking = await Booking.findOneAndUpdate(
        { _id: originalTransaction.bookingId },
        { status: 'Cancelled' },
        { new: true }
      );

      console.log('Refund successful. New transaction and booking updated:', refundTransaction, booking);

      res.status(200).json({ message: 'Refund successful', refund, refundTransaction, booking });

    } else {
      res.status(400).json({ message: 'Payment not successful. Refund not possible.' });
    }
  } catch (error) {
    console.error('Error in refundPayment:', error.message);
    res.status(500).json({ error: error.message });
  }
};
