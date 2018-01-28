var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');

var Order = require('../models/Order');
var Cart = require('../models/Cart');

csrfProtection = csrf();

var mongoose = require('mongoose');
mongoose.connect('localhost:27017/shopping-cart');

router.use(csrfProtection);


router.get('/profile', isLoggedIn, function (req, res, next) {
    Order.find({user: req.user}, function (err, orders) {
        if(err) {
            res.render('error');
        }
        var cart;
        orders.forEach(function (order) {
            cart = new Cart(order.cart);
            order.items = cart.generateArr();
        });
        res.render('user/profile', {orders: orders});
    });
});

router.get('/logout', isLoggedIn, function (req, res, next) {
    req.logout();
    res.redirect('/');
});

router.use('/', notLoggedIn, function (req,res, next) {
    next();
});

router.get('/signup', function (req, res, next) {
    var errors = req.flash('error');
    res.render('user/signup', {csrfToken: req.csrfToken(), errors: errors, hasErrors: errors.length > 0});
});

router.post('/signup', passport.authenticate('local.signup', {
    failureRedirect: '/user/signup',
    failureFlash: true
}), function (req, res, next) {
    if(req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    } else {
        res.redirect('/user/profile');
    }
});

router.get('/signin', function (req, res, next) {
    var errors = req.flash('error');
    res.render('user/signin', {csrfToken: req.csrfToken(), errors: errors, hasErrors: errors.length > 0});
});

router.post('/signin', passport.authenticate('local.signin', {
    failureRedirect: '/user/signin',
    failureFlash: true
}), function (req, res, next) {
    if(req.session.oldUrl) {
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    } else {
        res.redirect('/user/profile');
    }
});

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function notLoggedIn(req, res, next) {
    if(!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

module.exports = router;