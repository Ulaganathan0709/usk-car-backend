const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const dotenv = require('dotenv');
const generateToken = require('../utils/generateToken');
dotenv.config();

// Register User
exports.registerUser = async (req, res) => {
  const { name, email, password, username, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      role: role === 'seller' ? 'pending' : 'user',
    });

    const token = generateToken(user);

    const confirmUrl = `${process.env.FRONTEND_URL}/confirm/${token}`;
    const message = `Please confirm your email by clicking the following link: <a href="${confirmUrl}">Confirm Email</a>`;

    console.log('Sending confirmation email to:', user.email);

    await sendEmail({
      email: user.email,
      subject: 'Email Confirmation',
      message,
    });

    if (role === 'seller') {
      const adminMessage = `
        A new seller has registered and is pending your approval. 

        Name: ${name}
        Email: ${email}

        Please log in to the admin dashboard to review and approve the new seller.
      `;

      console.log('Sending admin notification email to:', process.env.ADMIN_EMAIL);

      await sendEmail({
        email: process.env.ADMIN_EMAIL,
        subject: 'New Seller Registration Pending Approval',
        message: adminMessage,
      });
    }

    res.status(201).json({ message: 'User registered, please confirm your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Confirm Email
exports.confirmEmail = async (req, res) => {
  const { token } = req.params;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: 'Email confirmed, you can now log in' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please confirm your email first' });
    }

    if (user.twoFactorEnabled) {
      const twoFactorCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.twoFactorCode = twoFactorCode;
      user.twoFactorCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      console.log('Sending 2FA code email to:', user.email);

      await sendEmail({
        email: user.email,
        subject: 'Your 2FA Code',
        message: `Your 2FA code is: ${twoFactorCode}`,
      });

      return res.status(200).json({ twoFactorRequired: true });
    }

    const token = generateToken(user);

    user.isLoggedIn = true;
    await user.save();

    res.status(200).json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify 2FA Code
exports.verify2FACode = async (req, res) => {
  const { email, twoFactorCode } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || user.twoFactorCode !== twoFactorCode || user.twoFactorCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired 2FA code' });
    }

    user.twoFactorCode = undefined;
    user.twoFactorCodeExpires = undefined;
    await user.save();

    const token = generateToken(user);

    user.isLoggedIn = true;
    await user.save();

    res.status(200).json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const resetToken = generateToken(user);
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
    const message = `You requested a password reset. Please click the following link to reset your password: <a href="${resetUrl}">Reset Password</a>`;

    console.log('Sending password reset email to:', user.email);

    await sendEmail({
      email: user.email,
      subject: 'Password Reset',
      message,
    });

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, password, twoFactorEnabled } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    if (password) user.password = await bcrypt.hash(password, 10);
    user.twoFactorEnabled = twoFactorEnabled !== undefined ? twoFactorEnabled : user.twoFactorEnabled;
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout User
exports.logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.isLoggedIn = false;
      await user.save();
    }
    res.status(200).json({ message: 'User logged out' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve Seller
exports.approveSeller = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = 'seller';
    await user.save();

    res.status(200).json({ message: 'User approved as seller' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Pending Sellers
exports.getPendingSellers = async (req, res) => {
  try {
    const users = await User.find({ role: 'pending' }).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Current User
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.validateToken = (req, res) => {
  // If the protect middleware has passed, the token is valid
  res.status(200).json({ user: req.user });
};
