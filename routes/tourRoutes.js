const express = require('express');
const tourController = require('./../controllers/tourController');

// ------------------------------------------------------------------

const router = express.Router();

// Middleware function to capture ID
// Only applicable to tour routes
router.param('id', tourController.checkID);

// Root of router URL
router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
