const {Game, validate} = require('../models/game');
const auth=require('../middleware/auth');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

router.get('/:id',async (req,res)=>{
    const game = await Game.findOne({gameId:req.params.id});
    if(!game) return res.status(402).send(`the User with id:${req.params.id} could not be found`);
    res.send(game);
});
router.get('/', async (req,res)=>{
    res.send(await Game.find({gameActive:true},'gameId gameName gameStarted gamePlayers'));
});

router.post('/',async (req,res)=>{
    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    let g = req.body;
    var game = new Game({
        gameId:g.gameId,
        gameName:g.gameName,
        gameTime:g.gameTime,
        gameActive:g.gameAvtive,
        gameStarted:g.gameStarted,
        gameStatedAt:g.gameStatedAt,
        gameEnded:g.gameEnded,
        gameEndedAt:g.gameEndedAt,
        gameAbandoned:g.gameAbandoned,
        gameSuspended:g.gameSuspended,
        gameAlphabet:g.gameAlphabet,
        gameAlphabetArray:g.gameAlphabetArray,
        gamePlayers:g.gamePlayers
    });
    await game.save();
    res.status(201).send(game);
});

module.exports = router;