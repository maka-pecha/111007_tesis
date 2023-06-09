const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const donationSchema = new Schema({
    price: Number,
    date: Date,
    donor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    place: {
        type: Schema.Types.ObjectId,
        ref: 'Place'
    },
});

module.exports = mongoose.model("Donation", donationSchema);
