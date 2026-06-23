const cors = require('cors');
const express = require("express");
const path = require("path");
const app = express();
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');

dotenv.config();

// Middleware Engine Configuration
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Fallback for local development
    credentials: true,
}));
app.use(express.json());

// Database Hook
connectDB();

const PORT = process.env.PORT || 5000;

// Health Check Entrypoint
app.get('/', (req, res) => {
    res.status(200).send('HomePage: Health check route');
});

// ==========================================
// CORE API ROUTE ROUTERS
// ==========================================
const authRoutes = require('./Routes/authRoutes');
app.use('/api/auth', authRoutes);

const compilerRoutes = require('./Routes/compilerRoutes');
app.use('/api/compiler', compilerRoutes);

const aiRoutes = require('./Routes/aiRoutes');
app.use('/api/ai', aiRoutes);

const dbRoutes = require('./Routes/dbRoutes');
app.use('/api/db', dbRoutes);

const profileRoutes = require('./Routes/profileRoutes');
app.use('/api/profile', profileRoutes);

// NEW: TESTHUB ROUTE INSTANCE MOUNT
const testHubRoutes = require('./Routes/testHubRoutes');
app.use('/api/testhub', testHubRoutes);

// ==========================================
// GLOBAL ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // MONGODB Validation Errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    // Unique/Duplicate Index Restrictions
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        message = `That ${field} is already taken.`;
    }

    // JWT Security Pipeline Expirations
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = "Your active login session has expired. Please log back in.";
    }

    console.error(`[Error Log]: ${message}`);
    
    res.status(statusCode).json({
        success: false,
        status: statusCode,
        message,
        errors: process.env.NODE_ENV === 'development' ? err.errors || null : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Listening to http://localhost:${PORT}`);
});