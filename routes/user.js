const router = require('express').Router();
const User = require('../models/user.model');
const mongoose = require('mongoose');


router.get('/profile', async (req,res,next) => {
    const person = req.user
    res.render('profile', {person});
})

router.post('/update-user-info', async (req, res, next) => {
    try {
        const { id, email } = req.body;

        // Checking for id and roles in req.body
        if (!id || !email) {
            req.flash('error', 'Invalid request');
            return res.redirect('back');
        }

        // Check for valid mongoose objectID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error', 'Invalid id');
            return res.redirect('back');
        }

        
        // Finally update the user
        const user = await User.findByIdAndUpdate(
            id,
            { email },
            { new: true, runValidators: true }
        );

        req.flash('info', `updated user ${user.email}`);
        res.redirect('back');
    } catch (error) {
        next(error);
    }
});

module.exports = router;