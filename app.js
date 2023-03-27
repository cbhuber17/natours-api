const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// Middlewares
app.use(morgan('dev'));

app.use(express.json()); // Middleware, allows post routes

// Create our own middleware
// "next" as 3rd arg by convention
// Order of this function is important when using express
// This should be called sooner than later; before the req/res cycle ends
app.use((req, res, next) => {
  console.log('Hello from middleware');
  next();
});

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

// Server code done separately
module.exports = app;
