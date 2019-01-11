const {User, validate} = require('../models/user');
const auth=require('../middleware/auth');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

router.get('/me',auth,async (req,res)=>{
    res.send(await User.findById(req.user._id,'-password'));
});

router.get('/:id',auth,async (req,res)=>{
    const user = await User.findById(req.params.id,'name email');
    if(!user) return res.status(402).send(`the User with id:${req.params.id} could not be found`);
    res.send(user);
});
router.post('/',async (req,res)=>{ //regiser
    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let user = await User.findOne({email:req.body.email});
    if(user) return res.status(400).send('User already exists');

    user = new User(_.pick(req.body,['name','email','password']));
    let salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password,salt);
    await user.save();

    let token = user.generateAuthToken();
    res.header('x-auth-token',token).send(_.pick(user,['_id','name','email']));
});

module.exports = router;