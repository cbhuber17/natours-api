const AppError = require('../utils/appError');
const Tour = require('./../Models/tourModel');

const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// Pre filling the query as "middleware"
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

// ------------------------------------------------------------------
// Handlers

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// ------------------------------------------------------------------

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, // $gte greater-than-equal, MONGO operation on the data
    },
    {
      $group: {
        _id: '$difficulty', // null will Select all
        numTours: { $sum: 1 }, // 1 will be added for each mongo document ("tour") returned
        numRatings: { $sum: '$ratingsQuantity' }, //$sum: MONGO operatior, aggregation pipeline
        avgRating: { $avg: '$ratingsAverage' }, // $avg, MONGO operator, aggregation pipeline
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // 1 for ascending
    },
    // {
    //   $match: { _id: { $ne: 'easy' } },  // Do another match, where ID is difficulty per the group above
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// ------------------------------------------------------------------

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // Unwind, have one document for each of the start dates.  No longer a list, but a single element
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // Mongo operator month
        numTourStarts: { $sum: 1 }, // Add them all up
        tours: { $push: '$name' }, // Create an array of your names, $push is MONGO method
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0, // Don't projection (show) ID in results.  1 means to show.
      },
    },
    {
      $sort: { numTourStarts: -1 }, // Sort descending
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});
