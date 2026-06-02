const cors = require('cors');
const express = require("express");
const path = require("path");
const app = express();
const dotenv = require('dotenv');
const connectDB = require('./config/db')
const cookieParser = require('cookie-parser');

dotenv.config();

app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
connectDB()


const PORT = process.env.PORT || 5000;

app.get('/' , (req , res) => {
    res.status(200).send('HomePage: Health check route');
})

const authRoutes = require('./Routes/authRoutes')
app.use('/api/auth', authRoutes)

const compilerRoutes = require('./Routes/compilerRoutes')
app.use('/api/compiler', compilerRoutes)

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // MONGODB Validation Errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `That ${field} is already taken.`;
    }

    console.error(`[Error Log]: ${message}`);
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message,
        errors: process.env.NODE_ENV === 'development' ? err.errors || null : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});


app.listen(PORT , () => {
    console.log(`Listening to http://localhost:${PORT}`);
});