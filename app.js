const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Global Middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Shows GET, POST, status codes etc. on server console
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 1 hour.',
});

// Limit access to the API route
app.use('/api', limiter);

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' })); // Middleware, allows post routes

// Data sanitization against NoSQL query injection, XSS
app.use(mongoSanitize());
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    // Allow multiple "duration", other parameters
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(express.static(`${__dirname}/public`)); // Serve static content (HTML files)

// ------------------------------------------------------------------

// Middleware to get time
// Testing
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ------------------------------------------------------------------
// Route mounting
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// Catch unhandled routes
app.all('*', (req, res, next) => {
  // Anything passed into next assumes error
  next(
    new AppError(`Unable to locate ${req.originalUrl} on this server!`, 404)
  );
});

// Middleware error handling
app.use(globalErrorHandler);

// Server code done separately
module.exports = app;
