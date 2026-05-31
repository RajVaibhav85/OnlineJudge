const express = require('express');
const User = require('../Models/User');
const router = express.Router();
const jwt = require('jsonwebtoken')
const protect = require('../Middlewares/authenticate');

router.post('/register' , async (req , res) => {
    const {username, email, password, dob} = req.body;
    try{
        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({message: 'User already exists'});
        }

        const user = await User.create({username, email, password, dob})
        res.status(201).json({
            id: user._id,
            username: user.username,
            email: user.email,
            dob: user.dob,
        })
    }
    catch(err){
        console.error("Register Error:", err);
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.post('/login', async (req, res) => {
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
            maxAge: 15 * 60 * 1000,     // 15-min
        });

        return res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.status(200).json({ message: 'Logged out' });
});

router.get("/me", protect, async (req , res) => {
    res.status(200).json(req.user)
})

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = router;