const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

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

app.use(express.json()); // Middleware, allows post routes

app.use(express.static(`${__dirname}/public`)); // Serve static content (HTML files)

// ------------------------------------------------------------------

// Middleware to get time
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
