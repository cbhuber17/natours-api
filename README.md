# Natours API

Capstone project of Jonas Schmedtmann's Node JS Course. Project is deployed at:

https://natours-ewub.onrender.com/

Additional TODO/Known Issues:

- Implement a restriction that users can only add a review to tours they booked
- On the profile page, add "My Reviews" and "Billing" page
- Create a sign up front end page that will utilize the sign-up API
- Document all APIs in Postman
- Create a form front end page that allows reviews to be added on a specific tour page
- Logging out does so successfully but results in an error, investigate this
- The checkout page does not retrieve the tour cover photo, this is most likely due to the very slow server of the free tier onredner.com

# Dev Environment

- Build the environment with `npm install`.
- From [package.json](package.json), run the server with `npm run dev`. App is available at: [http://127.0.0.1:8000/](http://127.0.0.1:8000/).
- From [package.json](package.json), watch for changes in the [public\js](public\js) folder with the command (in a separate terminal window) as `npm run watch:js`.

# Production Environment

- From [package.json](package.json), build the contents in the [public\js](public\js) folder with the command (in a separate terminal window) as `npm run build:js`.
