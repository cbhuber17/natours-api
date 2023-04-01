const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../Models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

// ------------------------------------------------------------------

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
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

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
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
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

// ------------------------------------------------------------------

// Protected routes for authenticated users
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // Getting the token and check if it exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in!  Please log in to get access', 401)
    );
  }

  // Verification of JWT token, promisify to return a promise
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // Check if user changed password after the JWT was issued
  // Instance method in usermodel.js
  if (freshUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError('User recently changed password!  Please log in again.', 401)
    );

  // Grant access to protected route
  req.user = freshUser;
  next();
});

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
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

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
  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

// ------------------------------------------------------------------
