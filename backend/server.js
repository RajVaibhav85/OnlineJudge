const cors = require('cors');
const express = require("express");
const path = require("path");
const app = express();
const dotenv = require('dotenv');
const authRoutes = require('./Routes/auth')
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
    res.status(200).send('HomePage');
})

app.use('/api/auth', authRoutes)


app.listen(PORT , () => {
    console.log(`Listening to http://localhost:${PORT}`);
});