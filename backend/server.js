const cors = require('cors');
const express = require("express");
const path = require("path");
const app = express();
const dotenv = require('dotenv');

const connectDB = require('./config/db')
dotenv.config();

app.use(cors());

const PORT = process.env.PORT || 5000;

app.get('/' , (req , res) => {
    res.status(200).send('HomePage');
})

app.get('/api/users' , (req , res) => {
    res.json([{name : 'Alice'} , {name : 'Bob'}])
})

connectDB()

app.listen(PORT , () => {
    console.log(`Listening to http://localhost:${PORT}`);
});