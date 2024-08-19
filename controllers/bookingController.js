const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a booking and process payment
exports.createBookingAndProcessPayment = async (req, res) => {
  const { userId, carId, fromDate, toDate, amount, days } = req.body;

  try {
    console.log("Received booking data:", { userId, carId, fromDate, toDate, amount, days });

    // Validate dates and calculate days
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid dates provided.");
    }
    const calculatedDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    console.log("Calculated days:", calculatedDays);

    // Create a new booking
    const booking = new Booking({
      userId,
      carId,
      fromDate: startDate,
      toDate: endDate,
      amount,
      days: calculatedDays > 0 ? calculatedDays : days,
      status: 'Pending',
    });

    await booking.save();
    console.log("Booking saved:", booking);

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in paise (smallest currency unit for INR)
      currency: 'inr',
      payment_method_types: ['card'],
      metadata: { bookingId: booking._id.toString() }
    });

    // Update booking with the payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    // Create a transaction record
    const transaction = await Transaction.create({
      bookingId: booking._id,
      paymentIntentId: paymentIntent.id,
      amount,
      status: 'Pending',
      paymentMethod: 'card',
    });

    console.log('Transaction created successfully:', transaction);

    // Respond with the client secret for the frontend to complete the payment
    res.status(201).json({ booking, clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error("Error in createBookingAndProcessPayment:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific booking by ID, including transaction and payment status
exports.getBookingById = async (req, res) => {
  try {
    console.log('Booking ID:', req.params.id);
    const booking = await Booking.findById(req.params.id).populate('carId userId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error('Error finding booking:', error.message);
    res.status(500).json({ error: error.message });
  }
};
exports.getBookingsByUserId = async (req, res) => {
  try {
    const userId = req.user._id;  // Ensure this is an ObjectId
    console.log('Fetching bookings for user:', userId);

    // Find all bookings for the logged-in user
    const bookings = await Booking.find({ userId }).populate('carId userId');

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this user' });
    }

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Cancel a booking and initiate a refund if payment was successful
exports.cancelBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const today = new Date();
    const bookingDate = new Date(booking.fromDate);

    // Check if the booking is for a future date
    if (bookingDate <= today) {
      return res.status(400).json({ message: 'Cannot cancel a past or current booking' });
    }

    // Check if the booking was paid for
    if (booking.status === 'Paid') {
      const paymentIntentId = booking.paymentIntentId;

      // Create a refund with Stripe
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
      });

      // Find the original transaction
      const originalTransaction = await Transaction.findOne({ paymentIntentId });

      if (!originalTransaction) {
        throw new Error('Original transaction not found.');
      }

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
      booking.status = 'Cancelled';
      await booking.save();

      console.log('Refund successful. New transaction and booking updated:', refundTransaction, booking);

      return res.status(200).json({ 
        message: 'Booking cancelled and refund initiated', 
        refund, 
        refundTransaction, 
        booking 
      });
    } else {
      // If the booking was not paid, simply cancel it
      booking.status = 'Cancelled';
      await booking.save();

      return res.status(200).json({ message: 'Booking cancelled successfully', booking });
    }

  } catch (error) {
    console.error('Error cancelling booking:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
