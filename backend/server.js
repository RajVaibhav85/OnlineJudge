const cors = require('cors');
const express = require("express");
const path = require("path");
const app = express();
const dotenv = require('dotenv');
const authRoutes = require('./Routes/auth')
const connectDB = require('./config/db')
dotenv.config();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/' , (req , res) => {
    res.status(200).send('HomePage');
})

// Mount auth routes
app.use('/api/auth', authRoutes)

connectDB()

app.listen(PORT , () => {
    console.log(`Listening to http://localhost:${PORT}`);
});