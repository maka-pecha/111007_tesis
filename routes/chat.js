const express = require('express');
const router = express.Router();
const chat = require('../controllers/chat');
const catchAsync = require('../utils/catchAsync');
const { subscribeToPlaces, subscribeToChat, validateMessage } = require('../middleware');

router.route('/')
    .get(subscribeToPlaces, subscribeToChat, catchAsync(chat.showChat))
    .post(validateMessage, chat.message)
router.route('/messages')
    .get(chat.getMes)


module.exports = router;
