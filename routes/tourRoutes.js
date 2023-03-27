const express = require('express');
const tourController = require('./../controllers/tourController');

// ------------------------------------------------------------------

const router = express.Router();

// Middleware function to capture ID
// Only applicable to tour routes that have ID
// router.param('id', tourController.checkID);

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
