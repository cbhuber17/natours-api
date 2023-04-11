const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

// ------------------------------------------------------------------

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// ------------------------------------------------------------------

// Send the JWT via cookie
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Cookie cannot be accessed or modified in any way; prevents XSS
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // only on HTTPS

  res.cookie('jwt', token, cookieOptions);

  // Remove PW from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// ------------------------------------------------------------------

exports.signup = catchAsync(async (req, res, next) => {
  // Prevent admin role, only extract what we want
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

// ------------------------------------------------------------------

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email/pw exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // Check if user exists and pw is correct
  // PW is set to "select: false" in the schema, here this adds it back temporarily
  const user = await User.findOne({ email }).select('+password');

  // correctPassword defined in userModel.js, instance method available on all mongo documents
  // If user doesn't exist, short circuit
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // All good, send token to client
  createSendToken(user, 200, res);
});

// ------------------------------------------------------------------

exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success' });
};

// ------------------------------------------------------------------

// Protected routes for authenticated users
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // Getting the token and check if it exists
  // Get JWT from authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // Otherwise get it from the browser cookie
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in!  Please log in to get access', 401)
    );
  }

  // Verification of JWT token, promisify to return a promise
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // Check if user changed password after the JWT was issued
  // Instance method in usermodel.js
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password!  Please log in again.', 401)
    );

  // Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// ------------------------------------------------------------------

// Only for rendered pages, no errors!
// Don't use catchAsync as it will throw an error if an invalid JWT is present
// Invalid JWT happens when the user logs out
exports.isLoggedIn = async (req, res, next) => {
  // JWT always comes from cookie here, not header
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // Reached this point - THERE IS A LOGGED IN USER
      // Locals (in the response) allows the pug views templates access to this variable
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next(); // No logged in user
    }
  }
  next();
};

// ------------------------------------------------------------------

exports.restrictTo = (...roles) => {
  // Return new function so that parameters can be passed into middleware
  return (req, res, next) => {
    // Roles is an array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};

// ------------------------------------------------------------------

exports.forgotPassword = async (req, res, next) => {
  // Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // Generate the random reset JWT
  const resetToken = user.createPasswordResetToken();

  // Don't validate fields prior to saving
  await user.save({ validateBeforeSave: false });

  // Send to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password?  Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\nIf you did not forget your password, please ignore this email!`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email, try again later.',
        500
      )
    );
  }
};

// ------------------------------------------------------------------

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Identify user by token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // If token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Use validators (not passing in validateBeforeSave)
  await user.save();

  //  Update changedPasswordAt property for the user

  // Log the user in, sent JWT
  createSendToken(user, 200, res);
});

// ------------------------------------------------------------------

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get the user from the DB
  // Since PW is hidden, just need it to show up here
  // Should not use findByIdAndUpdate() for anything related to passwords, validators will not engage
  const user = await User.findById(req.user.id).select('+password');

  // Check if POSTed current PW is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // If so, update PW
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // Log user in, send JWT
  createSendToken(user, 200, res);
});
