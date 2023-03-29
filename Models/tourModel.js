const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have <= 40 characters'],
      minlength: [10, 'A tour name must have >= 10 characters'],
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only contain alpha characters',
      // ],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be 1 at a minimum'],
      max: [5, 'Rating must be 5 at a maximum'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Custom validator
      validate: {
        validator: function (val) {
          // This only points to the current doc on NEW doc creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) must be below regular price.',
      },
    },
    summary: {
      type: String,
      trim: true, // Remove whitespace beginning/end
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // Never show when retrieving data
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Schema options
    toJSON: { virtuals: true },
  }
);

// Document middleware, pre middleware, runs before .save() and .create() methods
// But not .insertMany(), will not run this middleware
// Will act on the data prior to it being saved in the DB
// Called when there is a POST API request
tourSchema.pre('save', function (next) {
  // In the model schema, put the slug (safe URL string) as the name
  // this is a document object
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Post document middleware hook
// tourSchema.post('save', function(doc, next) {
//   next();
// })

// Virtual properties, not persistent in db
// Cannot use in query
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Query middleware
// Regex to apply to methods that start with "find"
tourSchema.pre(/^find/, function (next) {
  // this is a query object
  // Filter out secret tours
  this.find({ secretTour: { $ne: true } });
  next();
});

// Post query middleware hook
// tourSchema.post(/^find/, function (docs, next) {
//   next();
// });

// Aggregation middleware
tourSchema.pre('aggregate', function (next) {
  // this points to the current aggregation object
  // Filter out secret tours as part of the aggregation computations
  // Pipeline is an array, unshift adds to beginning of array
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
