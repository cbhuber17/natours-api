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
    minlength: 8,
    validate: {
      // Only works on SAVE! (User.save())
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// ------------------------------------------------------------------

// Pre-middleware hook, manipulate password before it enters DB
userSchema.pre('save', async function (next) {
  // If the pw is not modified, continue to next middleware
  if (!this.isModified('password')) return next;

  // 12 (cost) is good for CPU intensity speed
  this.password = await bcrypt.hash(this.password, 12);

  // Not needed to store in DB
  this.passwordConfirm = undefined;
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

  // Encrypted token in db
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// ------------------------------------------------------------------

const User = mongoose.model('User', userSchema);

module.exports = User;
