const express = require('express');
const {
  registerUser,
  confirmEmail,
  loginUser,
  verify2FACode,
  forgotPassword,
  resetPassword,
  updateProfile,
  logoutUser,
  approveSeller,
  getPendingSellers,
  getMe,
  validateToken,
} = require('../controllers/authController');
const { protect, roleCheck } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.get('/confirm/:token', confirmEmail);
router.post('/login', loginUser);
router.post('/verify-2fa', verify2FACode);
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword/:token', resetPassword);
router.put('/profile', protect, updateProfile);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);
router.get('/pending-sellers', protect, roleCheck(['admin']), getPendingSellers);
router.post('/approve-seller', protect, roleCheck(['admin']), approveSeller);
router.get('/validate-token', protect, validateToken);

module.exports = router;
