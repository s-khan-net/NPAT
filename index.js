const express = require('express');
const winston = require('winston');
const users =require('./routes/users');
const words =require('./routes/words');
const game =require('./routes/game');
const Joi = require('joi');
const fs = require('fs');
const mongoose = require('mongoose');
const {Game, validate} = require('./models/game');
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
require('dotenv').load();

mongoose.connect(process.env.mongoConnection)
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ level: 'info' }),
        new (winston.transports.File)({filename: 'logfile.log',level: process.env.loglevel})
    ]
});

process.on('unhandledRejection',function(e){
	console.log('rejection!!!: e', e)
})

app.use(express.json());
app.get('/join',(req,res)=>{
    res.sendFile(`${__dirname}/public/views/index.html`)}
);
//routes
app.use('/api/users',users);
app.use('/api/words',words);
app.use('/api/game',game);
//statics
app.use(express.static(`${__dirname}/public/views`));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/audio', express.static(__dirname + '/public/audio'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/images', express.static(__dirname + '/public/images'));
app.use('/assets', express.static(__dirname + '/assets'));


//check if jwtkey is present
if(!process.env.jwtKey) {
    logger.error('FATAL ERROR: jwt token key not set');
    process.exit(1);
}
else{
    logger.info(process.env.jwtKey);
}
let alphabets=['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
io.sockets.on('connection', function(socket) { //socket code
    socket.on('testMsg',function(obj){
        logger.error('test message');
        var data ={msg:'wassup from server',o:obj};
        io.sockets.emit('onTestMsg', data)
    })
    socket.on('addtogame',function(obj){
        checkAndAdd(socket.id,obj.gameId,obj.playerId,function(there){
            logger.info(`${obj.playerId} added to game?->>${there}`);
        });
    })
    socket.on('createGame', function(obj) {
        logger.info(`creating, joining game: ${obj.gameId} with socket id of ${socket.id}`);
        socket.join(`game-${obj.gameId}`);
    });

    socket.on('joinGame', function(obj) {
        const p = new Promise((resolve,reject)=>{
        if(obj.gameId && obj.playerId){
            logger.info(`player ${obj.playerId.split('-')[2]} joining ${obj.gameId}`);
            let player = { //make the player ,,, thought I could use _
                playerId: obj.playerId,
                playerName: obj.playerName,
                playerAvatar:obj.playerAvatar,
                isCreator:false,
                pointsForGame:[],
                wordsForGame:[],
                joinedAt:Date.now(),
                isActive:true
            }
            Game.findOne({gameId:obj.gameId},function(err,game){
                if(err){
                    logger.error(`Failed to get game from DB : ${err.message}`);
                    var d = {err:'could not join, please try again'}
                    resolve(d);
                }
                else{
                    logger.info(`got the game from DB`);
                    if(!game.gameEnded && game.gameActive){
                        game.gamePlayers.push(player); //add player to the game
                        logger.info('pushed the player to the game');
                        game.save()
                            .then(g=>{
                                logger.info(`saved the game with player ${obj.playerId.split('-')[2]}`);
                                var players=[];
                                g.gamePlayers.forEach((player,i)=>{
                                    if(player.isActive) {
                                        players.push(player);
                                    }
                                });
                                var d = {gameId:g.gameId,gamePlayers:players,gameTime:g.gameTime,gameStarted:g.gameStarted,gameStartedAt:g.gameStartedAt,playerId:obj.playerId,pushedPlayer:player,gameAlphabet:g.gameAlphabet,gameAlphabetArray:g.gameAlphabetArray,err:''};
                                socket.join(`game-${g.gameId}`);
                                resolve(d);
                            }) // save the game
                            .catch(err=>{
                                logger.error(`Error while saving the player to the game ${err.message}`);
                                var d = {err:'could not join, please try again'}
                                resolve(d);
                            })
                        
                    }else{
                        logger.info('the game has ended, should\'nt be in the list');
                        var d = {gameId:g.gameId,gamePlayers:g.gamePlayers,gameTime:g.gameTime,err:'game ended, please choose another one'};
                        resolve(d);
                    }
                }
            });
        }
        else{
                logger.error('Data to join not obtained');
                var d = {err:'game id or player id not obtained'};
                resolve(d);
            }
		});
		p.then(data=>{
            logger.info('emitting socket joined method to the UI');
            io.sockets.in(`game-${data.gameId}`).emit('joined', data)
        }).catch(err=>{
            logger.error(`Fatal Error occured while joining ${err}`)
            var data = {err:'could not join, please try again'}
            io.sockets.in(`game-${data.gameId}`).emit('joined', data)
        })
    });

    socket.on('message',function(obj){
        logger.info(`send chat message from player ${obj.playerId} with socket id of ${socket.id}`);
        try{
            io.sockets.in(`game-${obj.gameId}`).emit('onMessage',{playerName:obj.playerId.split('-')[2],playerAvatar:`images/avatars/${obj.playerId.split('-')[4].split('~')[0]}.png`,message:obj.message.replace('\n','<br>')});
        }
        catch(ex){
            logger.error(`error while sending chat message from player ${obj.playerId} error:${ex.message}`);
        }
    });

    socket.on('typing', function(val) { 
        try{
            val = val.split('~');
            socket.broadcast.to(`game-${val[0]}`).emit('onTyping', val);
        }
        catch(ex){
            logger.error(`error while sending typing message from player ${val[1]} error:${ex.message}`);
        }
    });  

    socket.on('points', function(val) { 
		val = val.split('~');
		io.sockets.in(`game-${val[0]}`).emit('onPoints', val);
    });
    
    socket.on('playStarted', function(gameId) { 
        logger.info(`starting ${gameId}`);
		let msg='Starting game...';
        io.sockets.in(`game-${gameId}`).emit('onWait',msg); //send wait for everyone in the game
        const p = new Promise((resolve,reject)=>{
            //get the game
            Game.findOne({gameId:gameId},function(err,game){
                if(err){
                    logger.error(`Could not retrieve ${gameId} from the database, erred out: ${err.message}`);
                    var d = {err:'could not start, please try again'}
                    io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                    resolve(d);
                }
                else{
                    logger.info(`got the game details from DB`);
                    if(game.gameAlphabetArray.length==0){//this might not be needed
                        game.gameAlphabetArray = alphabets;
                    }
                    //GENERATE RANDOM ALPHABET
                    let a = game.gameAlphabetArray[Math.floor(Math.random()*game.gameAlphabetArray.length)];
                    //remove a
                    game.gameAlphabetArray.splice(game.gameAlphabetArray.indexOf(a),1);
                    game.gameStarted=true;
                    game.gameStartedAt=Date.now();
                    game.save()
                        .then(g=>{
                            logger.info(`updated the game with start info and alphabet:${a}`);
                            var d = {gameId:g.gameId,alphabet:a,alphabetArray:g.gameAlphabetArray,gameTime:g.gameTime,gameStarted:g.gameStarted,gameStartedAt:g.gameStartedAt,err:''};
                            resolve(d);
                        })
                        .catch(err=>{
                            logger.error(`Could not save updated ${gameId} to the database, erred out: ${err.message}`);
                            var d = {err:'could not start, please try again'}
                            io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                            resolve(d);
                        });
                }
            });
		});
		
		p.then((data)=>{
            logger.info(`Emitting onPlayStart event to game : ${gameId}`)
			io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
			io.sockets.in(`game-${gameId}`).emit('onPlayStarted',data);
		}).catch(err=>{
            logger.error(`Fatal Error occured while starting ${err}`)
            var data = {err:'could not start dame, please try again'}
            io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
            io.sockets.in(`game-${data.gameId}`).emit('onPlayStarted', data)
        })
    });
    
    socket.on('submit', function(obj) { 
        logger.info(`submitting for ${obj.playerId} in game ${obj.gameId}`)
        if(obj.words.length == 0 && obj.pointsForGame == 0){ //means new layer
            logger.info(`Emitting onSubmit event game started for player: ${obj.playerId}to game : ${obj.gameId} `);
            var d = {gameId:obj.gameId,playerId:obj.playerId,err:''};
            io.sockets.in(`game-${obj.gameId}`).emit('onSubmit', d);
        }
        else{
            const p = new Promise((resolve,reject)=>{
                if(obj.gameId && obj.playerId){
                    Game.findOne({gameId:obj.gameId},function(err,game){
                        if(err){
                            logger.error(`Could not retrieve ${gameId} from the database, erred out: ${err.message}`);
                            var d = {err:'could not submit, please try again'}
                            resolve(d);
                        }
                        else{
                            logger.info(`got the game details from DB`);
                            if(!game.gameEnded && game.gameActive){
                                game.gamePlayers.forEach(player => {
                                    if(player.playerId == obj.playerId){
                                        player.wordsForGame.push(obj.words);
                                        player.pointsForGame.push(obj.pointsForGame);
                                    }
                                });
                                game.save()
                                .then(g=>{
                                    logger.info(`updated the game with submitted info for:${obj.playerId}`);
                                    var d = {gameId:g.gameId,playerId:obj.playerId,gameTime:g.gameTime,gameAlphabetArray:g.gameAlphabetArray,pointsForGame:obj.pointsForGame,err:''};
                                    resolve(d);
                                }) // update the player
                                .catch(err=>{
                                    logger.error(`Could not save updated ${obj.gameId} to the database, erred out: ${err.message}`);
                                    var d = {err:'could not submit, please try again'}
                                    resolve(d);
                                })
                            }
                            else{
                                var d = {err:'cannot submit, the game seems to have ended, oops!'};
                                resolve(d);
                            }
                        }
                    });  
                }
                else{

                }
            });
            p.then(data=>{
                logger.info(`Emitting onSubmit event for player: ${data.playerId}to game : ${data.gameId}`)
                io.sockets.in(`game-${data.gameId}`).emit('onSubmit', data);
                // io.sockets.in(`game-${data.gameId}`).emit('onPoints', {gameId:data.gameId,playerId:data.playerId,pointsForGame:g.pointsForGame});
            }).catch(err=>{
                logger.error(`Fatal Error occured while submitting ${err}`);
                var data = {err:'could not submit, please try again'}
                io.sockets.in(`game-${data.gameId}`).emit('onSubmit', data)
            })
        }
    });

    socket.on('newPlay',function(gameId){
        logger.info(`New play for game ${gameId}`)
		let msg='next letter...';
		io.sockets.in(`game-${gameId}`).emit('onWait',msg); //send wait for everyone in the game
		const p = new Promise((resolve,reject)=>{
            //get the game
            Game.findOne({gameId:gameId},function(err,game){
                if(err){
                    logger.error(`Could not retrieve ${gameId} from the database, erred out: ${err.message}`);
                    var d = {err:'could not start new play'}
                    io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                    resolve(d);
                }
                else if(!game.gameStarted){
                    logger.warn(`the game is not started! this should not happen!`);
                    var d = {err:'The game is not started! oops we dont figure how you got here. Sorry, you\'ll have to restart the game.'}
                }
                else if(game.gameAlphabetArray.length==0 && game.gameStarted==true){
                    //end the game
                    logger.info('All the alphabets are complete, end the game');

                }
                else{
                    logger.info('generating data for new play...');
                    //GENERATE RANDOM ALPHABET
                    let a = game.gameAlphabetArray[Math.floor(Math.random()*game.gameAlphabetArray.length)];
                    //remove a
                    game.gameAlphabetArray.splice(game.gameAlphabetArray.indexOf(a),1);
                    game.save()
                        .then(g=>{
                            logger.info(`updated the game with next info and alphabet:${a}`);
                            var d = {gameId:g.gameId,alphabet:a,alphabetArray:g.gameAlphabetArray,gameTime:g.gameTime,gameStarted:g.gameStarted,gameStartedAt:g.gameStartedAt,err:''};
                            resolve(d);
                        })
                        .catch(err=>{
                            logger.error(`Could not save updated ${gameId} to the database, erred out: ${err.message}`);
                            var d = {err:'could not start, please try again'}
                            io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                            resolve(d);
                        });
                }
            });
		});
		
		p.then((data)=>{
            logger.info(`Emitting onNewPlay for ${data.gameId} with alphabet ${data.alphabet}`);
			//io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
			io.sockets.in(`game-${gameId}`).emit('onNewPlay',data);
        })
        .catch(err=>{
            logger.error(`Fatal Error occured while starting ${err}`)
            var data = {err:'could not start dame, please try again'}
            //io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
            io.sockets.in(`game-${data.gameId}`).emit('onNewPlay', data)
        });
    });
    
    socket.on('endGame',function(gameId){
        logger.info(`End game ${gameId}`)
		let msg='Game over...';
        io.sockets.in(`game-${gameId}`).emit('onWait',msg); //send wait for everyone in the game
        const p = new Promise((resolve,reject)=>{
            //get the game
            Game.findOne({gameId:gameId},function(err,game){
                if(err){
                    logger.error(`Could not retrieve ${gameId} from the database, erred out: ${err.message}`);
                    var d = {err:'could not start new play'}
                    io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                    resolve(d);
                }
                else if(!game.gameStarted){
                    logger.warn(`the game is not started! this should not happen!`);
                    var d = {err:'The game is not started! oops we dont figure how you got here. Sorry, you\'ll have to restart the game.'}
                }
                else{
                    logger.info('updating game...');
                    game.gameEnded = true;
                    game.gameActive=false;
                    game.gameEndedAt = Date.now();
                    game.save()
                        .then(g=>{
                            logger.info(`updated the game with end status`);
                            var d = {gameId:g.gameId,gamePlayers:g.gamePlayers,gameStarted:g.gameStarted,err:''};
                            resolve(d);
                        })
                        .catch(err=>{
                            logger.error(`Could not save updated ${gameId} to the database, erred out: ${err.message}`);
                            var d = {err:'could not End, please try again'}
                            io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                            resolve(d);
                        });
                }
            });
        });

        p.then((data)=>{
            logger.info(`Emitting onEndGame for ${data.gameId}`);
			//io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
			io.sockets.in(`game-${data.gameId}`).emit('onEndGame',data);
        })
        .catch(err=>{
            logger.error(`Fatal Error occured while ending ${err}`)
            var data = {err:'could not end game, please try again'}
            //io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
            io.sockets.in(`game-${data.gameId}`).emit('onEndGame', data)
        });
    });

    socket.on('leave',function(obj){
        logger.info(`${obj.playerId} is leaving ${obj.gameId}`);
        if(obj.playerId && obj.gameId){
            const p = new Promise((resolve,reject)=>{
                //get the game
                Game.findOne({gameId:obj.gameId},function(err,game){
                    if(err){
                        logger.error(`Could not retrieve ${obj.gameId} from the database, erred out: ${err.message}`);
                        var d = {err:'could not leave'}
                        resolve(d);
                    }
                    else{
                        let actives=0;
                        if(game){
                            game.gamePlayers.forEach(player => {
                                if(player.playerId == obj.playerId){
                                    player.isActive = false;
                                }
                                if(player.isActive) actives++;
                            });
                            if(actives==0){
                                game.gamePlayers.forEach(player => {
                                    if(player.isActive) actives++;
                                });
                                if(actives==0){ 
                                    logger.info(`abandoning game ${obj.gameId} cause al the players left`);
                                    game.gameAbandoned=true;
                                }
                            }
                            game.save()
                            .then(g=>{
                                var d = {gameId:g.gameId,playerId:obj.playerId,err:''};
                                resolve(d);
                            })
                            .catch(err=>{
                                var d = {err:'could not leave'}
                                resolve(d);
                            });
                        }
                    }
                });
            });
            p.then(data=>{
                logger.info(`Emitting onLeave event for player: ${data.playerId} to game : ${data.gameId}`)
                io.sockets.in(`game-${data.gameId}`).emit('onLeave', data);
                socket.leave(`game-${data.gameId}`);
            }).catch(ex=>{
                logger.error(`Fatal error while leaving the game! ${ex.message}`);
                // var data = {err:'could not leave'}
                // io.sockets.in(`game-${data.gameId}`).emit('onLeave', data);
                // socket.leave(`game-${data.gameId}`);
            });
        }
    });

    socket.on('admin',function(obj){
        logger.info(`random admin generation for ${obj.gameId}`);
        if(obj.gameId){
            const p = new Promise((resolve,reject)=>{
                //get the game
                Game.findOne({gameId:obj.gameId},function(err,game){
                    if(err){
                        logger.error(`Could not retrieve ${obj.gameId} from the database, erred out: ${err.message}`);
                        var d = {err:'could not choose new admin'}
                        resolve(d);
                    }
                    else{
                        if(game){
                            var players = [];
                            game.gamePlayers.forEach(function(v,i){
                                if(v.isActive)
                                    players.push(v);
                            });
                            var player = players[Math.floor(Math.random()*players.length)] 
                            if(player){
                                player.isCreator = true;
                                game.gamePlayers.forEach(function(v,i){
                                    if(v.playerId == player.playerId){
                                        v.isCreator=true;
                                    }
                                });
                                game.save()
                                .then(g=>{
                                    var d = {gameId:g.gameId,playerId:player.playerId,err:''};
                                    resolve(d);
                                })
                                .catch(err=>{
                                    var d = {err:'could not choose random admin'}
                                    resolve(d);
                                });
                            }
                            else{
                                var d = {err:'could not choose random admin'}
                                resolve(d);
                            }
                        }
                    }
                });
            });
            p.then(data=>{
                logger.info(`Emitting onAdmin event for player: ${data.playerId} to game : ${data.gameId}`)
                io.sockets.in(`game-${data.gameId}`).emit('onAdmin', data);
            }).catch(ex=>{
                logger.error(`Fatal error while leaving the game! ${ex.message}`);
                // var data = {err:'could not leave'}
                // io.sockets.in(`game-${data.gameId}`).emit('onLeave', data);
                // socket.leave(`game-${data.gameId}`);
            });
        }
    });

    socket.on('abandon',function(obj){
        logger.info(`abadoning ${obj.gameId}`);
        if(obj.gameId){
            const p = new Promise((resolve,reject)=>{
                //get the game
                Game.findOne({gameId:obj.gameId},function(err,game){
                    if(err){
                        logger.error(`Could not retrieve ${obj.gameId} from the database, erred out: ${err.message}`);
                        var d = {err:'could not choose new admin'}
                        resolve(d);
                    }
                    else{
                        if(game){
                            game.gameActive = false;
                            game.gameAbandoned = true;
                            game.save()
                            .then(g=>{
                                var d = {gameId:g.gameId,err:''};
                                resolve(d);
                            })
                            .catch(err=>{
                                var d = {err:'could not abandon'};
                                resolve(d);
                            });
                        }
                    }
                });
            });
            p.then(data=>{
                logger.info(`ab andoning game : ${data.gameId}`)
                io.sockets.in(`game-${data.gameId}`).clients(function(err,clients){
                    if(err)
                        logger.error(`could'nt get player sockets in game`);   
                    else{
                        for(var i=0; i <clients.length; i++){
                            io.sockets.connected[clients[i]].disconnect(true); //disconnect everyone.
                        } 
                    }
                });
            }).catch(ex=>{
                logger.error(`Fatal error while leaving the game! ${ex.message}`);
                // var data = {err:'could not leave'}
                // io.sockets.in(`game-${data.gameId}`).emit('onLeave', data);
                // socket.leave(`game-${data.gameId}`);
            });
        }
    });

    function checkAndAdd(socketId,gameId,playerId,callback){
        io.of('/').in(`game-${gameId}`).clients((error, clients) => {
            if (error) callback(false);
            if(clients.indexOf(socketId)>-1)//client in room
                callback(true);
            else{//client not in room , add
                logger.info(`adding ${playerId} to game ${gameId}`)
                socket.join(`game-${gameId}`);
                callback(true);
            }
        });

    }
});
server.listen(process.env.PORT, function() {
    console.log(process.env.PORT);
});


// // Reduce the logging output of Socket.IO
// io.set('log level',1);