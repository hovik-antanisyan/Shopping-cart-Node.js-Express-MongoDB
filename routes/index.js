var express = require('express');
var router = express.Router();
var Cart = require('../models/Cart');

var Product = require('../models/Product');
var Order = require('../models/Order');
var mongoose = require('mongoose');
mongoose.connect('localhost:27017/shopping-cart');

/* GET home page. */
router.get('/', function (req, res, next) {
    Product.find({}).then(function (docs) {
        var successMsg = req.flash('success')[0];
        res.render('shop/index', {title: 'Shopping Cart', products: docs, successMsg: successMsg, noMsg: !successMsg});
    });
});

router.get('/add-to-cart/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    Product.findById(productId, function (err, product) {
        if(err) {
            res.render('error');
        }
        cart.add(product, productId);
        req.session.cart = cart;
        res.redirect('/');
    });
});

router.get('/shopping-cart', function (req, res, next) {
    if(!req.session.cart) {
        res.render('shop/shopping-cart', {products: null});
    }
    var cart = new Cart(req.session.cart);
    console.log(cart.generateArr());
    res.render('shop/shopping-cart', {products: cart.generateArr()});
});

router.get('/checkout', isLoggedIn, function (req, res, next) {
    if(!req.session.cart) {
        res.render('shop/shopping-cart', {products: null});
    }
    var errMsg = req.flash('error')[0];
    res.render('shop/checkout', {total: req.session.cart.totalPrice, errMsg: errMsg, noError: !errMsg});
});

router.get('/reduce/:id', function (req, res,next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart);
    cart.reduceByOne(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/remove-item/:id', function (req, res,next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart);
    cart.removeItem(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.post('/checkout', isLoggedIn, function (req, res, next) {
    if(!req.session.cart) {
        res.render('shop/shopping-cart', {products: null});
    }
    var cart = new Cart(req.session.cart);
    var stripe = require("stripe")(
        "sk_test_WI8LfkHw3Qdf8lX3moTkSOe7"
    );
    stripe.charges.create({
        amount: cart.totalPrice * 100,
        currency: "usd",
        source: req.body.stripeToken, // obtained with Stripe.js
        description: "Test charge"
    }, function(err, charge) {
        if(err) {
            var errMsg =  err.raw.message;
            res.render('shop/checkout', {oldInput: req.body, errMsg: errMsg, noError: !errMsg});
            console.log('error:  ', err);
        } else {
            var order = new Order({
                user: req.user,
                cart: cart,
                name: req.body.name,
                address: req.body.address,
                paymentId: charge.id
            });
            order.save(function (err, result) {
                if(err) {
                    res.render('error');
                }
                req.session.cart = null;
                req.flash('success', 'Successfully bought product.');
                res.redirect('/');
            });
        }
    });
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}
