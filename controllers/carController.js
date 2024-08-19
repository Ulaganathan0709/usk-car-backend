// controllers/carController.js
const Car = require('../models/Car');
const Review = require('../models/Review');

exports.createCar = async (req, res) => {
  try {
    const car = await Car.create(req.body);
    res.status(201).json(car);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCars = async (req, res) => {
  try {
    const { query } = req;
    const filter = {};

    if (query.model) {
      filter.model = query.model;
    }
    if (query.fuelType) {
      filter.fuelType = query.fuelType;
    }
    if (query.transmission) {
      filter.transmission = query.transmission;
    }
    if (query.seats) {
      filter.seats = query.seats;
    }
    if (query.minPrice || query.maxPrice) {
      filter.rentPerDay = {
        ...(query.minPrice && { $gte: query.minPrice }),
        ...(query.maxPrice && { $lte: query.maxPrice }),
      };
    }
    if (query.minRating) {
      filter.averageRating = { $gte: query.minRating };
    }

    const cars = await Car.find(filter);
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Calculate the average rating
    const reviews = await Review.find({ car: req.params.id });
    const averageRating = reviews.length > 0
      ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.status(200).json({ ...car.toObject(), averageRating });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.status(200).json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const carId = req.params.carId;

  try {
    const review = await Review.create({
      car: carId,
      user: req.user.id,
      rating,
      comment,
    });

    const reviews = await Review.find({ car: carId });
    const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

    await Car.findByIdAndUpdate(carId, { averageRating });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReviews = async (req, res) => {
  const carId = req.params.carId;

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

    const averageRating = (reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length).toFixed(1);
    await Car.findByIdAndUpdate(car._id, { averageRating });

    res.status(200).json({ message: 'Review updated', car });
  } catch (error) {
    console.error('Error updating review:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the review by ID
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the user is authorized to delete the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete the review
    await Review.deleteOne({ _id: id });

    // Update the car's average rating
    const car = await Car.findById(review.car);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const reviews = await Review.find({ car: review.car });
    
    // If there are no reviews left, set the average rating to 0
    const averageRating = reviews.length > 0
      ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
      : 0;

    // Update the car's average rating in the database
    car.averageRating = averageRating;
    await car.save();

    res.status(200).json({ message: 'Review removed', car });
  } catch (error) {
    console.error('Error deleting review:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
