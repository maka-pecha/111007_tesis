const { placeSchema, reviewSchema, userSchema, messageSchema } = require('./schemas.js');
const PubNub = require('./chat/pubnubConfig');
const ExpressError = require('./utils/ExpressError');
const Place = require('./models/place');
const Review = require('./models/review');
const User = require('./models/user');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.validatePlace = (req, res, next) => {
    const { error } = placeSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateUser = (req, res, next) => {
    const { error } = userSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.isAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/places/`);
    }
    next();
}

module.exports.isAuthor = async (req, res, next) => {
    const {id} = req.params;
    const place = await Place.findById(id);
    if (!place.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/places/${id}`);
    }
    next();
}

// This is a middleware function that checks if a user is the owner of a place.
// If they are not the owner, they are redirected to a different route.
module.exports.checkOwner = async (req, res, next) => {
    let id_place = req.params.id_place.toString();
    let user = req.user; // Assume you have authenticated user

    Place.findById(id_place)
        .then(place => {
            if (place.author.toString() !== user._id.toString()) {
                console.log("Redirected 1")
                return res.redirect(`${id_place}/${user._id}`);
            } else {
                next();
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).send('Server Error');
        });
}

module.exports.isUserOrOwner = async (req, res, next) => {
    let id_place = req.params.id_place.toString();
    let id = req.params.id.toString()
    let user = req.user; // Assume you have authenticated user

    Place.findById(id_place)
        .then(place => {
            if (place.author.toString() !== user._id.toString() && id !== user._id.toString()) {
                console.log(place.author.toString())
                console.log(id)
                console.log("Redirected 2")

                res.redirect(`/`);
            } else {
                next();
            }
        })
        .catch(err => {
            res.redirect(`/`);
        });
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const {id, reviewId} = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/places/${id}`);
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateMessage = (req, res, next) => {
    const { error } = messageSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.subscribeToPlaceChat = async (req, res, next) => {
    const PubNubInstance = PubNub.getInstance(req.user._id);
    const review = await Review.findById(reviewId);
    let channel = [`users.${req.params.id_place.toString()}.*`]

    try {
        PubNubInstance.subscribe({
            channels: channel,
            withPresence: true, // Set to true if you want to receive presence events as well
        });
        console.log("Subscribed!")
    } catch (error) {
        console.log(error)
    }
    next();
}

module.exports.subscribeToChat = async (req, res, next) => {
    const PubNubInstance = PubNub.getInstance(req.user._id);
    const id_place = req.params.id_place.toString()
    const id_user = req.user._id.toString()
    let channel = [`users.${req.params.id_place.toString()}.${req.params.id.toString()}`]
    const place = await Place.findById(id_place);
    if (!place.subscribers.includes(id_user) && req.user._id.toString() !== place.author.toString()){
        place.subscribers.push(id_user)
        place.save()
    }

    try {
        PubNubInstance.subscribe({
            channels: channel,
            withPresence: true, // Set to true if you want to receive presence events as well
        });
        console.log("Subscribed!")
    } catch (error) {
        console.log(error)
    }
    next();
}

module.exports.subscribeToPlaces = async (req, res, next) => {
    const PubNubInstance = PubNub.getInstance(req?.user?._id);
    await Place.find({ author: req?.user?._id }, (err, places) => {
            if (err) {
                console.error('Error executing query:', err);
                return;
            }
            if (places.length !== 0) {
                console.log("places", places)
                console.log(places.length !== 0)
                let placesChannels = []
                for (let place of places) {
                    placesChannels.push(`users.${place._id.toString()}.*`)
                }
                PubNubInstance.subscribe({
                    channels: [placesChannels],
                    withPresence: true, // Set to true if you want to receive presence events as well
                });
            }
            try {
                const subscribedChannels = PubNubInstance.getSubscribedChannels();
                console.log('Subscribed Channels:', subscribedChannels);
            } catch (error) {
                console.log(error)
            }

            next();
        }
    )
}
