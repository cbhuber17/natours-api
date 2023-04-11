const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

// ------------------------------------------------------------------

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Router middleware
// Use protected routes on all methods below this line (patch, get, etc.)
router.use(authController.protect);

// Current user routes
router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

// Router middleware
// Roles below this line are restricted to admin only
router.use(authController.restrictTo('admin'));

// Root of router URL
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
