const Review = require('../models/Review');
const Car = require('../models/Car');

// Create a new review
exports.createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const { carId } = req.params;

  try {
    const review = await Review.create({
      user: req.user._id,
      car: carId,
      rating,
      comment,
    });

    // Update car's average rating
    const car = await Car.findById(carId);
    const reviews = await Review.find({ car: carId });

    car.rating = (reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length).toFixed(1);
    await car.save();

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reviews for a car
exports.getReviewsByCar = async (req, res) => {
  const { carId } = req.params;

  try {
    const reviews = await Review.find({ car: carId }).populate('user', 'name');
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    // Update car's average rating
    const car = await Car.findById(review.car);
    const reviews = await Review.find({ car: review.car });

    car.rating = (reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length).toFixed(1);
    await car.save();

    res.status(200).json(review);
  } catch (error) {
    console.error('Error updating review:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  const { id } = req.params;

  try {
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Review.deleteOne({ _id: id });

    // Update the car's average rating
    const car = await Car.findById(review.car);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const reviews = await Review.find({ car: review.car });
    if (reviews.length === 0) {
      car.rating = 0;
    } else {
      car.rating = (reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length).toFixed(1);
    }

    await car.save();

    res.status(200).json({ message: 'Review removed' });
  } catch (error) {
    console.error('Error deleting review:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
