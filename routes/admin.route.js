const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const router = require('express').Router();
const {roles} = require('../utils/constants')
const { registerValidator } = require('../utils/validators');

router.get('/users-details', async (req, res, next) => {
    try {
        const users = await User.find();
        res.render('Admin/user_list', { users });
    } catch (error) {
        next(error);
    }
})

router.get('/add-user', async (req, res, next) => {
    try {
        res.render('Admin/add_user_form');
    } catch (error) {
        next(error);
    }
})

router.post(
    '/register',
    registerValidator,
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                errors.array().forEach((error) => {
                    req.flash('error', error.msg);
                });
                res.render('Admin/add_user_form', {
                    email: req.body.email,
                    messages: req.flash(),
                });
                return;
            }

            const { email } = req.body;
            const doesExist = await User.findOne({ email });
            if (doesExist) {
                req.flash('warning', 'Username/email already exists');
                res.redirect('/admin/add-user');
                return;
            }
            const user = new User(req.body);
            await user.save();
            
            req.flash(
                'success',
                `${user.email} registered succesfully`
            );
            res.redirect('/admin/add-user');
        } catch (error) {
            next(error);
        }
    }
);


router.get('/user/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error', 'Invalid Id!');
            res.redirect('/admin/users');
            return;
        }
        const person = await User.findById(id);
        res.render('profile', { person });
    } catch (error) {
        next(error);
    }
})

router.get('/user-edit/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error', 'Invalid Id!');
            res.redirect('/admin/users');
            return;
        }
        const person = await User.findById(id);
        res.render('Admin/edit_form', { person });
    } catch (error) {
        next(error);
    }
});

module.exports = router;