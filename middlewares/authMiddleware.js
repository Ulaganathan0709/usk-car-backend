const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // 1. Extract token from cookie or Authorization header
  if (req.cookies?.token) {
    token = req.cookies.token; // Token from cookie
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Token from Authorization header
  }

  // 2. If no token, return unauthorized error
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // 3. Verify token using secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Find user based on decoded token, exclude password field
    req.user = await User.findById(decoded.id).select('-password');

    // 5. If no user found, return error
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // 6. Proceed to the next middleware or route
    next();
  } catch (error) {
    // 7. Handle expired or invalid token errors
    console.error('JWT verification failed:', error.message);

    // Send specific message for expired tokens
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired, please log in again' });
    }

    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Middleware to check for specific roles
const roleCheck = (roles) => (req, res, next) => {
  // 8. Check if the user has one of the required roles
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Not authorized to access this route' });
  }

  // 9. Proceed to the next middleware or route
  next();
};

module.exports = { protect, roleCheck };
