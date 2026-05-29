const User = require('../Models/User')
const jwt = require('jsonwebtoken')


const protect = async (req , res , next) => {
    let token
    if(req.headers.autherization && req.headers.autherization.startsWith('Bearer')){
        try{
            token = req.headers.autherization.split(" ")[1];
    
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
            req.user = await User.findById(decoded.id).select("-password");
            return next();
        }
        catch(err){
            console.error("Token verification failed: ", err.message);
            return res.status(401).json({message: "Not authorized, token failed"});
        }
    }
}

module.exports = { protect };