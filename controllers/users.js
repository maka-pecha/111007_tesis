const User = require('../models/user');
const sendEmail = require('../utils/sendEmail');
const generateToken = require('../utils/generateVerificationToken');
const { cloudinary } = require("../cloudinary");
const mongoose = require("mongoose");

module.exports.index = async (req, res) => {
    const users = await User.find({}).populate('popupText');
    res.render('users/index', { users })
}

module.exports.indexSearch = async (req, res) => {
    const { name } = req.body;  // O asume que 'title' es el nombre
    let users = [];
    if(name){
        users = await User.find({
            $or: [
                {username: {$regex: name, $options: 'i'}},
                {email: {$regex: name, $options: 'i'}},
            ]
        });
    } else {
        users = await User.find({}).populate('popupText');
    }
    res.render('users/index', { users })
}

module.exports.renderNewForm = (req, res) => {
    res.render('users/new');
}

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

module.exports.createUser = async (req, res) => {
    try {
        const { email, username, isAdmin } = req.body.user;
        // Generate token
        const token = generateToken();
        const password = generateToken();

        if (await User.findOne({ email })) {
            req.flash('error', 'The email already exists, please select other');
            res.redirect('/users/new');
        }

        if (await User.findOne({ username })) {
            req.flash('error', 'The username already exists, please select other');
            res.redirect('/users/new');
        }
        const image = req.files.map(f => ({ url: f.path, filename: f.filename }));
        const user = new User({ email, username, password, image, isAdmin, verificationToken: token, isValidToken: false });
        const resp = await User.register(user, password);

        // Generate URL
        const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${resp.id}/${token}`;

        // Message object
        const message =
            `<div>
                <h2>Hello <b>${username}</b>, you have a new User in the platform DonateOnNetwork</h2> 
                <div>Please click on the following link to verify your email address:</div> 
                <a href=${verifyUrl}>${verifyUrl}</a>
                <div>This is your new password, is recommended to change it after log in: <b>${password}</b></div> 
            </div>`;

        // Send email
        await sendEmail({
            recipient: email,
            subject: 'Please verify your email address',
            message
        });

        req.flash('success', 'User created. Please tell to the user to verify his/her email before logging in.');
        res.redirect('/users');
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/places');
    }
}

module.exports.register = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const image = req.files.map(f => ({ url: f.path, filename: f.filename }));
        // Generate token
        const token = generateToken();


        const user = new User({ email, username, image, verificationToken: token, isValidToken: false, isAdmin: false });
        const resp = await User.register(user, password);

        // Generate URL
        const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${resp.id}/${token}`;

        // Message object
        const message =
            `<div>
                <div>Hello ${username}, please click on the following link to verify your email address:</div> 
                <a href=${verifyUrl}>${verifyUrl}</a>
            </div>`;

        // Send email
        await sendEmail({
            recipient: email,
            subject: 'Please verify your email address',
            message
        });

        req.flash('success', 'Verification email sent. Please verify your email before logging in.');
        res.redirect('/login');
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}

module.exports.renderForgotPassword = async (req, res) => {
    res.render('users/forgotPassword');
}

module.exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const token = generateToken();
        const user = await User.findOneAndUpdate({ email }, { verificationToken: token });
        await user.save();
        const verifyUrl = `${req.protocol}://${req.get('host')}/restore-password/${token}`;
        const message =
            `<div>
                <div>Hello ${user.username}, please click on the following link to restore your password:</div> 
                <a href=${verifyUrl}>${verifyUrl}</a>
            </div>`;
        await sendEmail({
            recipient: email,
            subject: 'Restore your password',
            message
        });
        req.flash('success', 'Restore password email sent. Please check your email');
        res.redirect('/login');
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/login');
    }
}

module.exports.renderRestorePassword = async (req, res) => {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    res.render('users/restorePassword', { user });
}

module.exports.restorePassword = async (req, res) => {
    try {
        const { token } = req.params;
        await User.findOne({ verificationToken: token }, async (err, user) => {
            try {
                await user.setPassword(req.body.user.password, async (err, user) => {
                    try {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        await user.save()
                        req.flash('success', 'Password restored!');
                        return res.redirect('/login')
                    } catch (err) {
                        req.flash('error', 'Sorry something went wrong')
                        return res.redirect('/login')
                    }
                });
            } catch (err) {
                req.flash('error', 'Password reset token is invalid or has expired')
                return res.redirect('/login')
            }
        });
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('/login');
    }
}

module.exports.showUser = async (req, res) => {
    const timestamp = mongoose.Types.ObjectId(req.params.id).getTimestamp();
    const date = new Date(timestamp).toLocaleString();
    const user = await User.findById(req.params.id);
    if (!user) {
        req.flash('error', 'Cannot find the current User!');
        return res.redirect('/user');
    }
    return res.render('users/show', { user, date });
}

module.exports.renderEditForm = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        req.flash('error', 'Cannot find the current User!');
        return res.redirect('/');
    }
    res.render('users/edit', { user });
}

module.exports.updateUser = async (req, res) => {
    const { isAdmin } = req.body.user;
    if (!isAdmin) req.body.user.isAdmin = false;
    const user = await User.findByIdAndUpdate(req.params.id, { ...req.body.user  });
    const image = req.files.map(f => ({ url: f.path, filename: f.filename }));
    user.image.push(...image);
    await user.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await user.updateOne({ $pull: { image: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated user!');
    res.redirect(`/users/${user._id}`)
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.renderVerify = async (req, res) => {
    const { token, id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isValidToken: true });
    let verify = false;
    if (token && token === user.verificationToken) {
        await user.save();
        verify = true;
    }
    res.render('users/verify', { verify });
}

module.exports.login = (req, res) => {
    if(req.user.isValidToken) {
        req.flash('success', 'Welcome back!');
        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    } else {
        req.flash('error', 'User is not verified by email!');
        res.redirect('/login');
    }

}

module.exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted user')
    res.redirect('/places');
}

module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', "Goodbye!");
    res.redirect('/');
}
