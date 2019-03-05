const {Game, validate} = require('../models/game');
const _ = require('lodash');
const express = require('express');
const router = express.Router();

// router.get('/:id',async (req,res)=>{
//     const game = await Game.findOne({gameId:req.params.id});
//     if(!game) return res.status(402).send(`the User with id:${req.params.id} could not be found`);
//     res.send(game);
// });
router.get('/', async (req,res)=>{
    const g = await Game.find({gameActive:true,gameEnded:false,gameAbandoned:false},'gameId gameName gameStarted gamePlayers gameAlphabetArray gameTime');
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
        let player = { //make the player ,,, thought I could use _
            playerId: obj.playerId,
            playerName: obj.playerName,
            playerAvatar:obj.playerAvatar,
            isCreator:false,
            pointsForGame:[],
            wordsForGame:[],
            joinedAt:Date.now()
        }
        let game = await Game.findOne({gameId:obj.gameId});
        if(!game.gameEnded && game.gameActive){
            game.gamePlayers.push(player); //add player to the game
            let g = await game.save(); // save the game
            res.status(201).send({game:g});
        }else{
            res.status(400).send('game ended, please choose another one');
        }
    }
    else{
        res.status(500).send('game id or player id not obtained');
    }
})

router.post('/',async (req,res)=>{
    const { error } = validate(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    let g = req.body; //not needed butt....
    const g1 = await Game.findOne({gameId:g.gameId},'gameId') //get the gameId
    if(g1) return res.status(400).send('Game already present!'); //oops!
    //console.log(g.gameStartedAt);
    var game = new Game({
        gameId:g.gameId,
        gameName:g.gameName,
        gameTime:g.gameTime,
        gameActive:g.gameActive,
        gamePrivate:g.gamePrivate,
        gameStarted:g.gameStarted,
        gameStartedAt:g.gameStartedAt,
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