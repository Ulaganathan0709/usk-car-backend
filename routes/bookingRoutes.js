const express = require('express');
const router = express.Router();
const {
  createBookingAndProcessPayment,
  getBookingById,
  getBookingsByUserId,
  cancelBooking
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

// Route to create a booking and process payment
router.post('/', protect, createBookingAndProcessPayment);

// Route to get all bookings for a specific user (user ID is inferred from the authenticated user)
router.get('/user', protect, getBookingsByUserId);

// Route to get booking details by ID (booking ID expected in the URL)
router.get('/:id', protect, getBookingById);


// Route to cancel a booking
router.post('/:id/cancel', protect, cancelBooking);

module.exports = router;
