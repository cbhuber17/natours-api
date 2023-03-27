const fs = require('fs');

// ------------------------------------------------------------------

// tour data
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

// ------------------------------------------------------------------

// Middleware function
exports.checkID = (req, res, next, val) => {
  console.log(`ID is: ${val}`);
  // *1 to convert to num
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  }
  next();
};

// ------------------------------------------------------------------

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing name or price',
    });
  }

  next();
};

// ------------------------------------------------------------------
// Handlers

exports.getAllTours = (req, res) => {
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

exports.getTour = (req, res) => {
  // ID checking done in middleware
  const id = req.params.id * 1; // Convert to number
  const tour = tours.find((el) => el.id === id);

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};

// ------------------------------------------------------------------

exports.createTour = (req, res) => {
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

exports.updateTour = (req, res) => {
  // ID checking done in middleware
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
};

// ------------------------------------------------------------------

exports.deleteTour = (req, res) => {
  // ID checking done in middleware
  // 204 don't send any data back
  res.status(204).json({
    status: 'success',
    data: null,
  });
};
