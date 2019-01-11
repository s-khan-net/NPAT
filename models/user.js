const Joi = require('joi');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('config');

const userSchema = new mongoose.Schema({
    name:{type:String, required:true, minlength:3},
    isActive:{type:Boolean,default:true},
    email:{type:String,required:true,unique:true,minlength:5},
    password:{type:String,required:true,minlength:5},
    isAdmin:Boolean
});
userSchema.methods.generateAuthToken = function(){
    return jwt.sign({_id:this._id,isAdmin:this.isAdmin},config.get('jwtKey'));
}
const User = mongoose.model('User', userSchema);

function validateUser(user){
    const schema = {
        name : Joi.string().min(3).required(),
        email:Joi.string().min(5).email().required(),
        password:Joi.string().min(5).required(),
        isAdmin:Joi.Boolean(),
        isActive:Joi.Boolean()
    };
    return Joi.validate(user,schema);
}

exports.User = User;
exports.validate = validateUser;