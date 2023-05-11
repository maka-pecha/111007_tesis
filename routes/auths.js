const express = require('express');
const router = express.Router();
const passport = require('passport');
const users = require('../controllers/users');
const catchAsync = require('../utils/catchAsync');
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

router.route('/register')
    .get(users.renderRegister)
    .post(upload.array('image'),catchAsync(users.register));

router.route('/login')
    .get(users.renderLogin)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), users.login)

router.route('/verify/:id/:token')
    .get(users.renderVerify)

router.route('/forgot-password')
    .get(users.renderForgotPassword)
    .put(users.forgotPassword)

router.route('/restore-password/:token')
    .get(users.renderRestorePassword)
    .put(users.restorePassword)

router.get('/logout', users.logout)

module.exports = router;
