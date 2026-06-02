const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authenticate');
const authController = require('../Controllers/authController')


router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

router.get("/me", protect, authController.me);

router.post('/refresh', authController.refresh);


module.exports = router;