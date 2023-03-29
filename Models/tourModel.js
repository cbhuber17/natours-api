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
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Post middleware hook
// tourSchema.post('save', function(doc, next) {
//   next();
// })

// Virtual properties, not persistent in db
// Cannot use in query
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
