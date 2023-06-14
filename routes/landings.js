const express = require('express');
const router = express.Router();
const landings = require('../controllers/landings');

router.route('/terms-and-conditions')
    .get(landings.renderTermsAndConditions);

router.route('/faq')
    .get(landings.renderFAQ);

module.exports = router;
