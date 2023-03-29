const express = require('express');
const tourController = require('./../controllers/tourController');

// ------------------------------------------------------------------

const router = express.Router();

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
  .get(tourController.getAllTours)
  .post(tourController.createTour); // Middleware check body first, create tour next

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
