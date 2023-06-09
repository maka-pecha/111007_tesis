const Place = require("../models/place");
const User = require("../models/user");
const mercadopago = require("../mercadoPago");
const Donation = require("../models/donation");
const puppeteer = require('puppeteer');

module.exports.index = async (req, res) => {
    let donations = await Donation.find({}).populate('donor').populate('place');
    donations.totalPrice = donations.reduce((accumulator, donation) => accumulator + donation.price, 0);
    res.render('donations/index', { donations, user: false, place: false })
}

module.exports.donationsByUser = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    let donations = await Donation.find({'donor': id}).populate('donor').populate('place');
    user.totalPrice = donations.reduce((accumulator, donation) => accumulator + donation.price, 0);
    res.render('donations/index', { donations, user: user, place: false })
}

module.exports.donationsToPlace = async (req, res) => {
    const { id } = req.params;
    const place = await Place.findById(id);
    let donations = await Donation.find({'place': id}).populate('donor').populate('place');
    place.totalPrice = donations.reduce((accumulator, donation) => accumulator + donation.price, 0);
    res.render('donations/index', { donations, place: place, user: false })
}

module.exports.donate = async (req, res) => {
    const { id } = req.params;
    try {
        const place = await Place.findById(id);
        req.body.place = place;
        await mercadopago.configure(place.mpAccessToken);
        const preferenceId = await mercadopago.createPreference(req, res);
        res.redirect(`https://www.mercadopago.com/mla/checkout/start?pref_id=${preferenceId}`);
    } catch (e) {
        req.flash('error', 'Temporally, cannot donate to this place');
        res.redirect(`/places/${id}`)
    }
}

module.exports.renderResult = async (req, res) => {
    const { id } = req.params;
    const place = await Place.findById(id);
    try {
        let result = false;
        const { donationAmount } = req.params;
        if (donationAmount) {
            const donation = new Donation({
                price: donationAmount,
                date: new Date().toLocaleString(),
                place: id,
            });
            donation.donor = req.user._id;
            place.donations.push(donation);
            await donation.save();
            await place.save();
            result = true;
            res.render(`donations/result`, { result, place_id: place._id });
        } else {
            res.render(`donations/result`, { result, place_id: place._id });
        }
    } catch (e) {
        req.flash('error', 'There was an error in your donation');
        res.redirect(`/places/${place._id}`)
    }
}
