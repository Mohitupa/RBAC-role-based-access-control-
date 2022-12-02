const express = require('express');
const createHttpError = require('http-errors');
const morgan = require('morgan');
const mongoose = require('mongoose');

require('dotenv').config();

const session = require('express-session');
const connectFlash = require('connect-flash');
const passport = require('passport');
const connectMongo = require('connect-mongo');
const { ensureLoggedIn } = require('connect-ensure-login');
const { roles } = require('./utils/constants')

const app = express();

app.use(morgan('dev'));
app.set('view engine', 'ejs')
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const MongoStore = connectMongo(session)

// Init Session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            // secure: true,
            httpOnly: true,
        },
        store: new MongoStore({ mongooseConnection: mongoose.connection }),
    })
);

app.use(passport.initialize());
app.use(passport.session());
require('./utils/passport.auth');

app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// Connect Flash
app.use(connectFlash());
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});


const PORT = process.env.PORT || 3000;

app.use('/', require('./routes'));
app.use('/auth', require('./routes/auth'));
app.use(
    '/user',
    ensureLoggedIn({ redirectTo: "/auth/login" }),
    require('./routes/user')
);

app.use(
    '/admin',
    ensureLoggedIn({ redirectTo: "/auth/login" }),
    ensureAdmin,
    require('./routes/admin.route')
);

app.use(
    '/super-admin',
    ensureLoggedIn({ redirectTo: "/auth/login" }),
    ensureSuperAdmin,
    require('./routes/super_admin.route')
);

app.use((req, res, next) => {
    next(createHttpError.NotFound());
})

app.use((error, req, res, next) => {
    error.status = error.status || 500;
    res.render('error_40x', { error });
    res.status(error.status);
})

mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connect");
    app.listen(PORT, () => {
        console.log("server is running on port ", PORT);
    })
}).catch((err) => {
    console.log(err);
})

// function ensureAuthenticated(req, res, next) {
//     if (req.isAuthenticated()) {
//         next()
//     } else {
//         res.redirect('/auth/login');
//     }
// }

function ensureSuperAdmin(req, res, next) {
    if (req.user.role === roles.superAdmin) {
        next();
    } else {
        req.flash('warning', 'you are not Authorized to see this route');
        res.redirect('back');
    }
}

function ensureAdmin(req, res, next) {
    if (req.user.role === roles.admin || req.user.role === roles.superAdmin) {
        next();
    } else {
        req.flash('warning', 'you are not Authorized to see this route');
        res.redirect('back');
    }
}