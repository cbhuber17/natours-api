const User = require('./../Models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');

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
    return next(new AppError('Incorrect email or password'));
  }

  // All good, send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
});

// ------------------------------------------------------------------
