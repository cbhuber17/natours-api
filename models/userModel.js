const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// ------------------------------------------------------------------

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'An email is required'],
    trim: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Incorrect email format'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // Do not display in the API
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // Only works on CREATE and SAVE! (User.save())
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// ------------------------------------------------------------------

// Pre-middleware hook, manipulate password before it enters DB
// Comment out when importing users from file
userSchema.pre('save', async function (next) {
  // If the pw is not modified, continue to next middleware
  if (!this.isModified('password')) return next();

  // 12 (cost) is good for CPU intensity speed
  this.password = await bcrypt.hash(this.password, 12);

  // Not needed to store in DB
  this.passwordConfirm = undefined;
  next();
});

// ------------------------------------------------------------------

// Pre-middleware hook, update passwordChangedAt
// Comment out when importing users from file
userSchema.pre('save', function (next) {
  // PW not modified or new document in mongo, move to next middleware
  if (!this.isModified('password') || this.isNew) return next();

  // Subtract 1 second
  // Changed token happened before changing password
  // Ensure token has been created after password has been changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// ------------------------------------------------------------------

// Query middleware, anything that starts with "find".
// Don't leak inactive users
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } }); // ne, not equal, mongo operation
  next();
});

// ------------------------------------------------------------------

// Instance method available in all documents in a mongo collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// ------------------------------------------------------------------

// Instance method
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

// ------------------------------------------------------------------

// Instance method
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Encrypted token in DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // 10 min expiry
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// ------------------------------------------------------------------

const User = mongoose.model('User', userSchema);

module.exports = User;
