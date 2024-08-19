const express = require('express');
const { protect, roleCheck } = require('../middlewares/authMiddleware');
const {
  createCar,
  getCars,
  getCarById,
  updateCar,
  deleteCar,
  addReview,
  getReviews,
  updateReview,
  deleteReview,
} = require('../controllers/carController');

const router = express.Router();

router.route('/')
  .get(getCars)
  .post(protect, roleCheck(['seller', 'admin']), createCar);

router.route('/:id')
  .get(getCarById)
  .put(protect, roleCheck(['seller', 'admin']), updateCar)
  .delete(protect, roleCheck(['seller', 'admin']), deleteCar);

router.route('/:carId/reviews')
  .get(getReviews)
  .post(protect, addReview);

router.route('/reviews/:id')  // Ensure this matches the ID parameter name in the controller.
  .delete(protect, deleteReview)
  .put(protect, updateReview);

module.exports = router;
