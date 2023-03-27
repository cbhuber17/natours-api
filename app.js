const fs = require('fs');
const express = require('express');
const morgan = require('morgan');

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
// Route handlers

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// ------------------------------------------------------------------

const getAllTours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
};

// ------------------------------------------------------------------

const getTour = (req, res) => {
  const id = req.params.id * 1; // Convert to number
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

// ------------------------------------------------------------------

const createTour = (req, res) => {
  // Last ID plus 1 is new ID
  const newId = tours[tours.length - 1].id + 1;
  const newTour = Object.assign({ id: newId }, req.body);
  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    }
  );
};

// ------------------------------------------------------------------

const updateTour = (req, res) => {
  // *1 to convert to num
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
};

// ------------------------------------------------------------------

const deleteTour = (req, res) => {
  // *1 to convert to num
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }

  // 204 don't send any data back
  res.status(204).json({
    status: 'success',
    data: null,
  });
};

// ------------------------------------------------------------------
// Routes

// Same code
// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
app.route('/api/v1/tours').get(getAllTours).post(createTour);

// Same code
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);
app
  .route('/api/v1/tours/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

// ------------------------------------------------------------------
// Start server

const port = 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
