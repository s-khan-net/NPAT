const {Game, validate} = require('../models/game');
const auth=require('../middleware/auth');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

// router.get('/:id',async (req,res)=>{
//     const game = await Game.findOne({gameId:req.params.id});
//     if(!game) return res.status(402).send(`the User with id:${req.params.id} could not be found`);
//     res.send(game);
// });
router.get('/', async (req,res)=>{
    const g = await Game.find({gameActive:true},'gameId gameName gameStarted gamePlayers');
    if(g) res.status(200).send({game:g});
    else res.status(401).send('Games not found');
});
router.get('/:gameId', async (req,res)=>{
    const g = await Game.findOne({gameId:req.params.gameId});
    if(g) res.status(200).send({game:g});
    else res.status(401).send('Game not found');
});

router.post('/join',async (req,res)=>{
    let obj = req.body;
    console.log(obj);
    if(obj.gameId && obj.playerId){
        let player = {
            playerId: obj.playerId,
            playerName: obj.playerName,
            playerAvatar:'1.png',
            isCreator:false,
            pointsForGame:[],
            joinedAt:Date.now()
        }
        let g = await Game.findOneAndUpdate({gameId:req.params.gameId},
            { "$push": { "gamePlayers": player} },
        );
        console.log(g);
        res.status(201).send({game:g});
    }
    else{
        res.status(500).send('game id or player id not obtained');
    }
})

router.post('/',async (req,res)=>{
    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    let g = req.body;
    const g1 = await Game.findOne({gameId:g.gameId},'gameId gameName gameStarted gamePlayers')
    if(g1) return res.status(400).send('Game already present!, create a new game or join one');
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