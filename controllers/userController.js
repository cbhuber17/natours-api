const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');

// ------------------------------------------------------------------

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    // user-uniqueid-timestamp
    // Set the properties of the file
    const ext = file.mimetype.split('.')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});

// Filter to detect images
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image!  Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

// ------------------------------------------------------------------

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// ------------------------------------------------------------------

// Middleware
// Get ID of currently logging in user
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// ------------------------------------------------------------------

exports.updateMe = catchAsync(async (req, res, next) => {
  // Create error if user tries to POST PW data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates.  Please use /updateMyPassword',
        400
      )
    );
  }

  // Update user document
  // Only allow changes to name and role
  // req.body contains everything, should not allow someone to change e.g. role to admin
  const filteredBody = filterObj(req.body, 'name', 'email');

  // Location of the file
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // Return new object
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// ------------------------------------------------------------------

// Deactivate your account
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// ------------------------------------------------------------------

// This is done by /signup route
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message:
      'This route is not yet defined!  Please use /signup route instead.',
  });
};

// ------------------------------------------------------------------

// For admins only, should not update PW with updateUser
exports.updateUser = factory.updateOne(User);
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteOne(User);
