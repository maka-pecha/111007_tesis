const express = require('express');
const router = express.Router();
const donations = require('../controllers/donations');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAdmin} = require('../middleware');

router.route('/place/:id')
    .post(isLoggedIn, catchAsync(donations.donate))

router.route('/')
    .get(isLoggedIn, isAdmin, catchAsync(donations.index))

router.route('/user/:id')
    .get(isLoggedIn, catchAsync(donations.donationsByUser))

router.route('/place/:id')
    .get(isLoggedIn, catchAsync(donations.donationsToPlace))

router.route('/:id/result/:donationAmount')
    .get(isLoggedIn, catchAsync(donations.renderResult))

router.route('/:id/result/fail')
    .get(isLoggedIn, catchAsync(donations.renderResult))

router.route('/graphics')
    .get(isLoggedIn, isAdmin, catchAsync(donations.getGraphics))
    .post(isLoggedIn, isAdmin, catchAsync(donations.getGraphicsPerDate))

module.exports = router;
