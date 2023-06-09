const express = require('express');
const router = express.Router();
const chat = require('../controllers/chat');
const catchAsync = require('../utils/catchAsync');
const { subscribeToPlaces, subscribeToChat, validateMessage, checkOwner, isUserOrOwner } = require('../middleware');


router.route('/')
    .get(subscribeToPlaces, catchAsync(chat.showChat))
    .post(validateMessage, chat.message)
router.route('/global')
    .get(subscribeToPlaces, catchAsync(chat.showGlobalChat))
    .post(validateMessage, chat.message)
router.route('/:id_place')
    .get(checkOwner,catchAsync(chat.showPlaceChats) )
router.route('/:id_place/:id')
    .get(isUserOrOwner, subscribeToChat, catchAsync(chat.showChat))
    .post(validateMessage,chat.testPost)



module.exports = router;
