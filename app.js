const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// Middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Shows GET, POST, status codes etc. on server console
}

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
  res.status(404).json({
    status: 'fail',
    message: `Can't locate ${req.originalUrl} on this server!`,
  });
});

// Server code done separately
module.exports = app;
