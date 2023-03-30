const mongoose = require('mongoose');
const dotenv = require('dotenv');

// This needs to be manually hoisted to ensure all exceptions are caught
process.on('uncaughtException', (err) => {
  console.log('Unhandled exception');
  console.log(err.name, err.message);
  process.exit(1);
});

// Tell dotenv where our env variables are
dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));

// ------------------------------------------------------------------
// Start server

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// Global handling of uncaught promises outside of mongoose
process.on('unhandledRejection', (err) => {
  console.log('Unhandled promise rejection.  Exiting...');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
