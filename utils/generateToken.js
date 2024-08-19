// generateToken.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Generates a JWT for the given user.
 * @param {Object} user - The user object.
 * @param {string} user._id - The user's unique identifier.
 * @param {string} user.role - The user's role (e.g., 'user', 'admin', 'seller').
 * @returns {string} - Signed JWT.
 */
const generateToken = (user) => {
    try {
        // Payload contains user's ID and role
        const payload = {
            id: user._id,
            role: user.role,
        };

        // Sign the token with the secret key and set an expiration time
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1hr', // Token is valid for 30 days
        });

        return token;
    } catch (error) {
        console.error('Error generating token:', error.message);
        throw new Error('Token generation failed');
    }
};

module.exports = generateToken;
