const dotenv = require('dotenv');
const app = require('./app');

// Tell dotenv where our env variables are
dotenv.config({ path: './config.env' });

// ------------------------------------------------------------------
// Start server

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
