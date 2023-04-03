const mongoose = require('mongoose');

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
  this.populate({
    path: 'tour',
    select: 'name',
  }).populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
