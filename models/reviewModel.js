const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // Parent referencing to tour and user
    // We don't want huge arrays in the parent elements
    // Not sure how large arrays will be?  Opt for parent ref.
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    // Virtual properties, such as aggregating stats, we want them
    // to show up whenever there is an output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Query middleware
// Regex to apply to methods that start with "find"
// The "tour" and "user" fields in the tour model schema expects an object ID
// This "populate" field will grab that object "tour" and "user" ID and populate as if its embedded in the DB
// i.e. with the user details, name, email etc.
// However it is not embedded, this is just a neat trick to use populate to get name, email, etc.
reviewSchema.pre(/^find/, function (next) {
  // Removed since this is too much information including the tour
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// Calculate the average ratings using MONGO operations
// Use a static method which is bound to the class, not the instance
// Calculating average doesn't make sense to do on instance methods
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      // Group tours together by tour
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, // Mongo operator to add 1 for each tour
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // Persist this change into the DB
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // Set to default values
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Middleware to save the averages
// Call the constructor of tour to allow access to the static function in this middleware
// Use post (as in later, not HTTP method), instead of pre to ensure all docs are in the DB
// when executing this middleware.  .post does not use next().
// Queries are not available in .post().  Queries are available in .pre().
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

// Look for findByIdAndUpdate, findByIdAndDelete
// Update the ratings average when a review is added or deleted
// Here just stores temporary info for the post() method to access
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // Save results to access in post middleware
  this.r = await this.findOne();
  next();
});

// Use post (as in later, not HTTP method), instead of pre to ensure all docs are in the DB
// when executing this middleware.  .post does not use next().
// When a review is added or deleted, update the ratings
// Queries are not available here
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
