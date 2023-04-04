const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

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
      set: (val) => Math.round(val * 10) / 10, // Trick to round to 2 decimal places
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
    startLocation: {
      // GeoJSON for geospatial data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'], // Only 1 option
      },
      coordinates: [Number], // Longitude first
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
    // Child referencing, not to do as there could be thousands of reviews
    // polluting the tour (parent) object
    // reviews: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Review',
    //   },
    // ],
  },
  {
    // Schema options
    // Virtual properties, such as aggregating stats, we want them
    // to show up whenever there is an output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
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

// Save the complete user profile (from user DB) into the tour DB, as embedding
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map((id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// Post document middleware hook
// tourSchema.post('save', function(doc, next) {
// Will save document into DB
//   next();
// })

// Index the price in ascending order and the ratings avg in descending order
// Indexing allows DBs to search faster for better performance
// Multiple parameters is a compound index
// Study access patters on the DB to determine which ones to index
tourSchema.index({ price: 1, ratingsAverage: -1 });

// Slug will become most queried field
tourSchema.index({ slug: 1 });

// Tell mongo that startLocation is based on 2dsphere datum
tourSchema.index({ startLocation: '2dsphere' });

// Virtual properties, not persistent in db
// Cannot use in query
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Instead of doing child referencing as commented out in the schema above
// Capture the reviews as a virtual method, this is how to connect
// tour and review models together (virtual populate)
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Query middleware
// Regex to apply to methods that start with "find"
tourSchema.pre(/^find/, function (next) {
  // this is a query object
  // Filter out secret tours
  this.find({ secretTour: { $ne: true } });
  next();
});

// Query middleware
// Regex to apply to methods that start with "find"
// The "guides" field in the tour model schema expects an object ID
// This "populate" field will grab that object "guides" ID and populate as if its embedded in the DB
// i.e. with the tour guide details, name, email etc.
// However it is not embedded, this is just a neat trick to use populate to get name, email, etc.
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt', // Do not display these fields in the API for the guides
  });
  next();
});

// Post query middleware hook
// tourSchema.post(/^find/, function (docs, next) {
//   next();
// });

// Aggregation middleware
// Commented out because tourController .getDistance() has $geoNear, and this needs to be run first
// in a pipeline
// tourSchema.pre('aggregate', function (next) {
//   // this points to the current aggregation object
//   // Filter out secret tours as part of the aggregation computations
//   // Pipeline is an array, unshift adds to beginning of array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
