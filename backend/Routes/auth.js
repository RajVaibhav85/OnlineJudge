const express = require('express');
const User = require('../Models/Users');
const router = express.Router();
const jwt = require('jsonwebtoken');
const protect = require('../Middlewares/authenticate');


router.post('/register', async (req, res, next) => { 
    const { username, email, password, dob } = req.body;
    try {
        const user = await User.create({ username, email, password, dob });
        const token = generateToken(user._id);
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000,
        });

        res.status(201).json({
            id: user._id,
            username: user.username,
            email: user.email,
            dob: user.dob,
        });
    }
    catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }
        
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        const token = generateToken(user._id);
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000,
        });

        return res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
        });

    } catch (err) {
        next(err);
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.status(200).json({ message: 'Logged out' });
});

router.get("/me", protect, async (req, res, next) => {
    try {
        const currentUser = await User.findById(req.user.id).select('-password');
        
        if (!currentUser) {
            return res.status(404).json({ message: "User no longer exists" });
        }
        
        res.status(200).json(currentUser);
    } catch (error) {
        next(error);
    }
});
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

module.exports = router;