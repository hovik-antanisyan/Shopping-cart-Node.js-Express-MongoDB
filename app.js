var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var mongoose = require('mongoose');
var Handlebars = require('handlebars');
var expressSession = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(expressSession);

Handlebars.registerHelper('ifvalue', function (conditional, options) {
    if(options.hash.equals === ((conditional+1)%3)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
});

mongoose.connect('localhost:27017/shopping-cart');
require('./config/passport');

var index = require('./routes/index');
var userRouter = require('./routes/user');

var app = express();

// view engine setup
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());
app.use(expressSession({
    secret: 'HovikSecret',
    resave: false, saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection}),
    cookie: {maxAge: 100 * 60 * 1000}
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
    res.locals.session = req.session;
    res.locals.login = req.isAuthenticated();
    next();
});

app.use('/', index);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
