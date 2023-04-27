const express = require('express');
const router = express.Router();
const users = require('../controllers/users');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, validateUser } = require("../middleware");

router.route('/:id')
    .get(catchAsync(users.showUser))
    .put(isLoggedIn, validateUser, catchAsync(users.updateUser))

router
    .get('/:id/edit', isLoggedIn, catchAsync(users.renderEditForm))

module.exports = router;
