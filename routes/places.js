const express = require('express');
const router = express.Router();
const places = require('../controllers/places');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isAuthor, isAuthorOrAdmin, validatePlace, subscribeToPlaces, isAdmin} = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

router.route('/')
    .get(subscribeToPlaces,catchAsync(places.index))
    .post(isLoggedIn, upload.array('image'), catchAsync(places.indexSearch))

router.route('/user/:id')
    .get(subscribeToPlaces,catchAsync(places.indexByAuthor))
    .post(isLoggedIn, upload.array('image'), catchAsync(places.indexSearch))

// router.route('/my-places')
//     .get(subscribeToPlaces,catchAsync(places.indexByAuthor))
//     .post(isLoggedIn, upload.array('image'), catchAsync(places.indexSearch))

router.route('/new')
    .get(isLoggedIn, places.renderNewForm)
    .post(isLoggedIn, upload.array('image'), validatePlace, catchAsync(places.createPlace))

router.route('/:id')
    .get(catchAsync(places.showPlace))
    .put(isLoggedIn, isAuthor, upload.array('image'), validatePlace, catchAsync(places.updatePlace))
    .delete(isLoggedIn, isAuthorOrAdmin, catchAsync(places.deletePlace));

router.get('/:id/edit', isLoggedIn, isAuthorOrAdmin, catchAsync(places.renderEditForm))

module.exports = router;
