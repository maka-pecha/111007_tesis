const express = require('express');
const router = express.Router();
const users = require('../controllers/users');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, validateUser, isAdmin } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

router.route('/')
    .get(isLoggedIn, isAdmin, catchAsync(users.index))
    .post(isLoggedIn, upload.array('image'), catchAsync(users.indexSearch))

router.route('/new')
    .get(isLoggedIn, users.renderNewForm)
    .post(isLoggedIn, upload.array('image'), validateUser, catchAsync(users.createUser))

router.route('/:id')
    .get(catchAsync(users.showUser))
    .put(isLoggedIn, upload.array('image'), validateUser, catchAsync(users.updateUser))
    .delete(isLoggedIn, isAdmin, catchAsync(users.deleteUser));

router
    .get('/:id/edit', isLoggedIn, catchAsync(users.renderEditForm))

module.exports = router;
