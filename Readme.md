# Car Rental Backend API

This is the backend API for the Car Rental application. It provides endpoints for user authentication, car management, booking management, payment processing, and transaction management. The backend is built using Node.js and Express, with a MongoDB database.

## Technology Stack

- **Node.js**: Server-side JavaScript runtime.
- **Express.js**: Web application framework for Node.js.
- **MongoDB**: NoSQL database.
- **Mongoose**: ODM library for MongoDB and Node.js.
- **JWT**: JSON Web Tokens for authentication.
- **Stripe**: Payment processing.
- **dotenv**: Environment variable management.
- **cors**: Cross-Origin Resource Sharing.
- **cookie-parser**: Middleware to parse cookies.

## Deployment

**Backend**: The backend application is deployed on Render.

### Deployment URL

- **Backend URL**: [https://your-render-deployment-url.onrender.com](https://your-render-deployment-url.onrender.com)

## API Endpoints

### Authentication
- **POST /api/auth/register**: Register a new user.
- **GET /api/auth/confirm/:token**: Confirm user email using the token.
- **POST /api/auth/login**: Login a user.
- **POST /api/auth/verify-2fa**: Verify Two-Factor Authentication code.
- **POST /api/auth/forgotpassword**: Send password reset email.
- **POST /api/auth/resetpassword/:token**: Reset password using a token.
- **PUT /api/auth/profile**: Update user profile.
- **GET /api/auth/me**: Get logged-in user profile.
- **POST /api/auth/logout**: Logout a user.
- **GET /api/auth/pending-sellers**: Get list of pending sellers (Admin only).
- **POST /api/auth/approve-seller**: Approve seller (Admin only).
- **GET /api/auth/validate-token**: Validate token for logged-in user.

### Booking Management
- **POST /api/bookings**: Create a booking and process payment.
- **GET /api/bookings/user**: Get all bookings for the logged-in user.
- **GET /api/bookings/:id**: Get booking details by ID.
- **POST /api/bookings/:id/cancel**: Cancel a booking.

### Car Management
- **GET /api/cars**: Get list of cars.
- **POST /api/cars**: Add a new car (Admin/Seller only).
- **GET /api/cars/:id**: Get car details by ID.
- **PUT /api/cars/:id**: Update car details (Admin/Seller only).
- **DELETE /api/cars/:id**: Delete a car (Admin/Seller only).
- **GET /api/cars/:carId/reviews**: Get reviews for a car.
- **POST /api/cars/:carId/reviews**: Add a review to a car.
- **PUT /api/cars/reviews/:id**: Update a review.
- **DELETE /api/cars/reviews/:id**: Delete a review.

### Payment Management
- **POST /api/payments/create-payment-intent**: Create a payment intent with Stripe.
- **POST /api/payments/confirm-payment**: Confirm payment and update transaction status.
- **POST /api/payments/refund-payment**: Refund a payment.

### Transaction Management
- **POST /api/transactions**: Create a new transaction.
- **GET /api/transactions/:id**: Get a transaction by ID.
- **PUT /api/transactions/:id/status**: Update the status of a transaction.
- **GET /api/transactions**: List all transactions.

### User Management
- **GET /api/user/profile**: Get user profile.
- **PUT /api/user/profile**: Update user profile.

## Setup and Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/project-name-backend.git
   cd project-name-backend
