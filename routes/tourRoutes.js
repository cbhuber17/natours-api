const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');
// ------------------------------------------------------------------

const router = express.Router();

// Bring in the review router to post reviews from a tour
router.use('/:tourId/reviews', reviewRouter);

// Middleware types: document, query, aggregate and model

// Alias route of popular queries
// Alias via aliasTopTours as middleware
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Aggregation pipeline in MONGO route
router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

// Root of router URL
router
  .route('/')
  .get(authController.protect, tourController.getAllTours) // Check protected routes of auth users
  .post(tourController.createTour); // Middleware check body first, create tour next

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// Nested routing
// POST /tour/<tour_id>/reviews  // Reviews is a child of tour (POST)
// GET /tour/<tour_id>/reviews   // Get reviews
// GET /tour/<tour_id>/reviews/<review_id> // Get a specific review
// Since it involves reviews, this code doesn't belong here in the tour router
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

module.exports = router;
