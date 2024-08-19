const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware to parse JSON requests
app.use(express.json());
app.use(cookieParser());


// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL, // Use the FRONTEND_URL from the .env file
    credentials: true // Allow credentials
  }));

// Import routes
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');


// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/user', userRoutes);


// Middleware for handling 404 errors
app.use(notFound);

// Middleware for handling errors
app.use(errorHandler);

const PORT = process.env.PORT || 5000;


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


