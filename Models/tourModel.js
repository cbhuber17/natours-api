const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
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
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: Number,
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
