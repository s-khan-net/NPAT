const jwt = require('jsonwebtoken');
require('dotenv').load();


module.exports = function (req,res,next){
    const token = req.header('x-auth-token');
    if(!token) return res.status(401).send('Access denied. No token provided');

    try{
        let decoded = jwt.verify(token,process.env.jwtKey);
        req.user = decoded;
        next();
    }
    catch(ex){
        res.status(400).send('Access denied. Invalid token');
    }
}