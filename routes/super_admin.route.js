const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const router = require('express').Router();
const {roles} = require('../utils/constants')
const { registerValidator } = require('../utils/validators');

router.get('/users', async (req, res, next) => {
    try {
        const users = await User.find();
        res.render('manage_users', { users });
    } catch (error) {
        next(error);
    }
})

router.delete('/user-delete/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error', 'Invalid Id!');
            res.redirect('/admin/users');
            return;
        }
        if (req.user.id === id) {
            req.flash(
                'error',
                'Admins cannot remove themselves from Admin, ask Super admin.'
            );
            return res.redirect('back');
        }
        
        let p = await User.findById(id); 
        console.log(p);
        if(p.role = 'SUPER ADMIN') {
            req.flash(
                'error',
                `You don't have permission to delete Super Admin.`
            );
            res.redirect("/admin/users-details");
        }

        if(req.user.role == "ADMIN") {
            await User.deleteOne({ _id: id });
            req.flash("success","User Deleted Succesfully")
            res.redirect("/admin/users-details");
        } 
        req.flash(
            'error',
            `You don't have permission to delete users.`
        );
        res.redirect("/admin/users-details");
    } catch (error) {
        next(error);
    }
});

router.post('/update-role', async (req, res, next) => {
    try {
        const { id, role } = req.body;

        // Checking for id and roles in req.body
        if (!id || !role) {
            req.flash('error', 'Invalid request');
            return res.redirect('back');
        }

        // Check for valid mongoose objectID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error', 'Invalid id');
            return res.redirect('back');
        }

        // Check for Valid role
        const rolesArray = Object.values(roles);
        if (!rolesArray.includes(role)) {
            req.flash('error', 'Invalid role');
            return res.redirect('back');
        }

        // Admin cannot remove himself/herself as an admin
        if (req.user.id === id) {
            req.flash(
                'error',
                'Super Admins cannot remove themselves from Super Admin, ask another Super admin.'
            );
            return res.redirect('back');
        }

        // Finally update the user
        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        );

        req.flash('info', `updated role for ${user.email} to ${user.role}`);
        res.redirect('back');
    } catch (error) {
        next(error);
    }
});

module.exports = router;