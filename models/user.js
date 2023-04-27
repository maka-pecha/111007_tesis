const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true } };

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    image: [ImageSchema],
    verificationToken: {
        type: String,
    },
    isValidToken: {
        type: Boolean,
    },
}, opts);

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
