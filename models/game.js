const Joi = require('joi');
const mongoose = require('mongoose');
// const jwt = require('jsonwebtoken');
// const config = require('config');

const gameSchema = new mongoose.Schema({
        gameId:{type:String, required:true},
        gameName:{type:String, required:true},
        gameTime:{type:Number,required:true,min:0,max:255},
        gameActive:{type:Boolean,default:true},
        gameStarted:{type:Boolean,default:false},
        gameStartedAt:{type:Date},
        gameEnded:{type:Boolean,default:false},
        gameEndedAt:{type:Date},
        gameAbandoned:{type:Boolean,default:false},
        gameSuspended:{type:Boolean,default:false},
        gameAlphabet:{type:String},
        gameAlphabetArray:[String],
        gamePlayers:[
            {
                playerId:{type:String, required:true},
                playerName:{type:String, required:true},
                playerAvatar:{type:String},
                isCreator:{type:Boolean,default:true},
                pointsForGame:[Number],
                wordsForGame:[],
                joinedAt:{type:Date}
            }
        ]
    });

// gameSchema.methods.generateAuthToken = function(){
//     return jwt.sign({_id:this._id,isAdmin:this.isAdmin},config.get('jwtKey'));
// }
const Game = mongoose.model('Game', gameSchema);

function validateGame(game){
    const schema = {
        gameId:Joi.string().required(),
        gameName:Joi.string().required(),
        gameTime:Joi.number().required(),
        gameActive:Joi.boolean().required(),
        gameStarted:Joi.boolean().required(),
        gameStartedAt:Joi.date(),
        gameEnded:Joi.boolean().required(),
        gameEndedAt:Joi.date(),
        gameAbandoned:Joi.boolean().required(),
        gameSuspended:Joi.boolean().required(),
        gameAlphabet:Joi.string().allow(''),
        gameAlphabetArray:Joi.array().items(Joi.any()),
        gamePlayers:Joi.array().items(Joi.object({
            playerId:Joi.string().required(),
            playerName:Joi.string().required(),
            playerAvatar:Joi.string(),
            isCreator:Joi.boolean().required(),
            pointsForGame:Joi.array().items(Joi.number()),
            wordsForGame:Joi.array().items(Joi.any()),
            joinedAt:Joi.date()
        }))
    };
    return Joi.validate(game,schema);
}

exports.Game = Game;
exports.validate = validateGame;