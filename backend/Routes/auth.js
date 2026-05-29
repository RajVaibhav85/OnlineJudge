const express = require('express');
const User = require('../Models/User');
const router = express.Router();
const jwt = require('jsonwebtoken')
const { protect } = require('../Middlewares/authenticate');

router.post('/register' , async (req , res) => {
    const {username, email, password} = req.body;
    try{
        const userExists = await User.findOne({email});
        if(userExists){
            return res.status(400).json({message: 'User already exists'});
        }

        const user = await User.create({username, email, password})
        const token = generateToken(user._id);
        res.status(201).json({
            id: user._id,
            username: user.username,
            email: user.email,
            token, 
        })
    }
    catch(err){
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.post('/login' , async (req , res) => {
    const {email, password} = req.body

    try{
        const user = await User.findOne({email});
        if(!user || user.matchPassword(password)){
            res.status(401).json({message: 'Invalid Credentials'})
        }
        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email
        })
    }
    catch(err){
        res.status(500).json({message: 'Internal Server Error'})
    }
})

router.get("/me", protect, async (req , res) => {
    res.status(200).json(req.user)
})

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expireIn: "30d"})
}

module.exports = router;