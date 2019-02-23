const express = require('express');
const config = require('config');
const winston = require('winston');
const users =require('./routes/users');
const words =require('./routes/words');
const game =require('./routes/game');
const Joi = require('joi');
const mongoose = require('mongoose');
const {Game, validate} = require('./models/game');
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

mongoose.connect('mongodb://localhost/NPAT')//mongodb://npatuser:npat!1234@ds060749.mlab.com:60749/npat_db')
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

winston.add(winston.transports.File,{filename:'logfile.log'});

process.on('unhandledRejection',function(e){
	console.log('rejection!!!: e', e)
})

app.use(express.json());
//routes
app.use('/api/users',users);
app.use('/api/words',words);
app.use('/api/game',game);
//statics
app.use(express.static(`${__dirname}/public/views`));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/images', express.static(__dirname + '/public/images'));

// app.use('/',(req,res)=>{
//     res.sendFile(`${__dirname}/public/views/index.html`)}
// );
// app.use('/Join',(req,res)=>{
//     res.sendFile(`${__dirname}/public/views/index.html`)}
// );
//app.use(express.static(__dirname + '/public'));

//check if jwtkey is present
if(!config.get('jwtKey')) {
    console.log('FATAL ERROR: jwt token key not set');
    process.exit(1);
}
let alphabets=['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

io.sockets.on('connection', function(socket) { //socket code
    winston.info(`someone connected ${socket.id}`);

    socket.on('createGame', function(obj) { //is whole game
        winston.info(`creating, joining game: ${obj.gameId}`);
        socket.join(`game-${obj.gameId}`);
    });

    socket.on('joinGame', function(obj) {
        const p = new Promise((resolve,reject)=>{
        if(obj.gameId && obj.playerId){
            winston.info(`player ${obj.playerId.split('-')[2]} joining ${obj.gameId}`);
            let player = { //make the player ,,, thought I could use _
                playerId: obj.playerId,
                playerName: obj.playerName,
                playerAvatar:obj.playerAvatar,
                isCreator:false,
                pointsForGame:[],
                wordsForGame:[],
                joinedAt:Date.now()
            }
            Game.findOne({gameId:obj.gameId},function(err,game){
                if(err){
                    winston.error(`Failed to get game from DB : ${err.message}`);
                    var d = {err:'could not join, please try again'}
                    resolve(d);
                }
                else{
                    winston.info(`got the game from DB`);
                    if(!game.gameEnded && game.gameActive){
                        game.gamePlayers.push(player); //add player to the game
                        winston.info('pushed the player to the game');
                        game.save()
                            .then(g=>{
                                winston.info(`saved the game with player ${obj.playerId.split('-')[2]}`);
                                 var d = {gameId:g.gameId,gamePlayers:g.gamePlayers,gameTime:g.gameTime,gameStarted:g.gameStarted,gameStartedAt:g.gameStartedAt,playerId:obj.playerId,gameAlphabetArray:g.gameAlphabetArray,err:''};
                                socket.join(`game-${g.gameId}`);
                                resolve(d);
                            }) // save the game
                            .catch(err=>{
                                winston.error(`Error while saving the player to the game ${err.message}`);
                                var d = {err:'could not join, please try again'}
                                resolve(d);
                            })
                        
                    }else{
                        winston.info('the game has ended, should\'nt be in the list');
                        var d = {gameId:g.gameId,gamePlayers:g.gamePlayers,gameTime:g.gameTime,err:'game ended, please choose another one'};
                        resolve(d);
                    }
                }
            });
        }
        else{
                winston.error('Data to join not obtained');
                var d = {err:'game id or player id not obtained'};
                resolve(d);
            }
		});
		p.then(data=>{
            winston.info('emitting socket joined method to the UI');
            io.sockets.in(`game-${data.gameId}`).emit('joined', data)
        }).catch(err=>{
            winston.error(`Fatal Error occured while joining ${err}`)
            var data = {err:'could not join, please try again'}
            io.sockets.in(`game-${data.gameId}`).emit('joined', data)
        })
    });

    socket.on('message',function(obj){
        winston.info(`send chat message from player ${obj.playerId}`);
        try{
            io.sockets.in(`game-${obj.gameId}`).emit('onMessage',{playerName:obj.playerId.split('-')[2],playerAvatar:`images/avatars/${obj.playerId.split('-')[4].split('~')[0]}.png`,message:obj.message});
        }
        catch(ex){
            winston.error(`error while sending chat message from player ${obj.playerId} error:${ex.message}`);
        }
    });

    socket.on('typing', function(val) { 
        try{
            val = val.split('~');
            socket.broadcast.to(`game-${val[0]}`).emit('onTyping', val);
        }
        catch(ex){
            winston.error(`error while sending typing message from player ${val[1]} error:${ex.message}`);
        }
    });  

    socket.on('points', function(val) { 
		val = val.split('~');
		io.sockets.in(`game-${val[0]}`).emit('onPoints', val);
    });
    
    socket.on('playStarted', function(gameId) { 
        winston.info(`starting ${gameId}`);
		let msg='Starting game...';
        io.sockets.in(`game-${gameId}`).emit('onWait',msg); //send wait for everyone in the game
        const p = new Promise((resolve,reject)=>{
            //get the game
            Game.findOne({gameId:gameId},function(err,game){
                if(err){
                    winston.error(`Could not retrieve ${gameId} from the database, erred out: ${err.message}`);
                    var d = {err:'could not start, please try again'}
                    io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                    resolve(d);
                }
                else{
                    winston.info(`got the game details from DB`);
                    if(game.gameAlphabetArray.length==0){
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
                            winston.info(`updated the game with start info and alphabet:${a}`);
                            var d = {gameId:g.gameId,alphabet:a,alphabetArray:g.gameAlphabetArray,gameTime:g.gameTime,gameStarted:g.gameStarted,gameStartedAt:g.gameStartedAt,err:''};
                            resolve(d);
                        })
                        .catch(err=>{
                            winston.error(`Could not save updated ${gameId} to the database, erred out: ${err.message}`);
                            var d = {err:'could not start, please try again'}
                            io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                            resolve(d);
                        });
                }
            });
		});
		
		p.then((data)=>{
            winston.info(`Emitting onPlayStart event to game : ${gameId}`)
			io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
			io.sockets.in(`game-${gameId}`).emit('onPlayStarted',data);
		}).catch(err=>{
            winston.error(`Fatal Error occured while starting ${err}`)
            var data = {err:'could not start dame, please try again'}
            io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
            io.sockets.in(`game-${data.gameId}`).emit('onPlayStarted', data)
        })
    });
    
    socket.on('submit', function(obj) { 
        winston.info(`submitting for ${obj.playerId} in game ${obj.gameId}`)
        if(obj.words.length == 0 && obj.pointsForGame == 0){ //means new layer
            winston.info(`Emitting onSubmit event game started for player: ${obj.playerId}to game : ${obj.gameId} `);
            var d = {gameId:obj.gameId,playerId:obj.playerId,err:''};
            io.sockets.in(`game-${obj.gameId}`).emit('onSubmit', d);
        }
        else{
            const p = new Promise((resolve,reject)=>{
                if(obj.gameId && obj.playerId){
                    Game.findOne({gameId:obj.gameId},function(err,game){
                        if(err){
                            winston.error(`Could not retrieve ${gameId} from the database, erred out: ${err.message}`);
                            var d = {err:'could not submit, please try again'}
                            resolve(d);
                        }
                        else{
                            winston.info(`got the game details from DB`);
                            if(!game.gameEnded && game.gameActive){
                                game.gamePlayers.forEach(player => {
                                    if(player.playerId == obj.playerId){
                                        player.wordsForGame.push(obj.words);
                                        player.pointsForGame.push(obj.pointsForGame);
                                    }
                                });
                                game.save()
                                .then(g=>{
                                    winston.info(`updated the game with submitted info for:${obj.playerId}`);
                                    var d = {gameId:g.gameId,playerId:obj.playerId,gameTime:g.gameTime,gameAlphabetArray:g.gameAlphabetArray,pointsForGame:g.pointsForGame,err:''};
                                    resolve(d);
                                }) // update the player
                                .catch(err=>{
                                    winston.error(`Could not save updated ${obj.gameId} to the database, erred out: ${err.message}`);
                                    var d = {err:'could not submit, please try again'}
                                    resolve(d);
                                })
                            }
                            else{
                                var d = {gameId:g.gameId,gamePlayers:g.gamePlayers,gameTime:g.gameTime,err:'cannot submit, the game seems to have ended, oops!'};
                                resolve(d);
                            }
                        }
                    });  
                }
                else{

                }
            });
            p.then(data=>{
                winston.info(`Emitting onSubmit event for player: ${data.playerId}to game : ${data.gameId}`)
                io.sockets.in(`game-${data.gameId}`).emit('onSubmit', data);
                // io.sockets.in(`game-${data.gameId}`).emit('onPoints', {gameId:data.gameId,playerId:data.playerId,pointsForGame:g.pointsForGame});
            }).catch(err=>{
                winston.error(`Fatal Error occured while submitting ${err}`);
                var data = {err:'could not submit, please try again'}
                io.sockets.in(`game-${data.gameId}`).emit('onSubmit', data)
            })
        }
    });

    socket.on('newPlay',function(gameId){
        winston.info(`New play for game ${gameId}`)
		let msg='next letter...';
		io.sockets.in(`game-${gameId}`).emit('onWait',msg); //send wait for everyone in the game
		const p = new Promise((resolve,reject)=>{
            //get the game
            Game.findOne({gameId:gameId},function(err,game){
                if(err){
                    winston.error(`Could not retrieve ${gameId} from the database, erred out: ${err.message}`);
                    var d = {err:'could not start new play'}
                    io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                    resolve(d);
                }
                else if(!game.gameStarted){
                    winston.warn(`the game is not started! this should not happen!`);
                    var d = {err:'The game is not started! oops we dont figure how you got here. Sorry, you\'ll have to restart the game.'}
                }
                else if(game.gameAlphabetArray.length==0 && game.gameStarted==true){
                    //end the game
                    winston.info('All the alphabets are complete, end the game');

                }
                else{
                    winston.info('generating data for ne play...');
                    //GENERATE RANDOM ALPHABET
                    let a = game.gameAlphabetArray[Math.floor(Math.random()*game.gameAlphabetArray.length)];
                    //remove a
                    game.gameAlphabetArray.splice(game.gameAlphabetArray.indexOf(a),1);
                    game.save()
                        .then(g=>{
                            winston.info(`updated the game with next info and alphabet:${a}`);
                            var d = {gameId:g.gameId,alphabet:a,alphabetArray:g.gameAlphabetArray,gameTime:g.gameTime,gameStarted:g.gameStarted,gameStartedAt:g.gameStartedAt,err:''};
                            resolve(d);
                        })
                        .catch(err=>{
                            winston.error(`Could not save updated ${gameId} to the database, erred out: ${err.message}`);
                            var d = {err:'could not start, please try again'}
                            io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                            resolve(d);
                        });
                }
            });
		});
		
		p.then((data)=>{
            winston.info(`Emitting onNewPlay for ${data.gameId} with alphabet ${data.alphabet}`);
			//io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
			io.sockets.in(`game-${gameId}`).emit('onNewPlay',data);
        })
        .catch(err=>{
            winston.error(`Fatal Error occured while starting ${err}`)
            var data = {err:'could not start dame, please try again'}
            //io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
            io.sockets.in(`game-${data.gameId}`).emit('onNewPlay', data)
        })
    })
    
    socket.on('leave',function(obj){
        winston.info(`${obj.playerId} is leaving ${obj.gameId}`);
        socket.leave(`game-${obj.gameId}`);
        io.sockets.in(`game-${obj.gameId}`).emit('onLeave', obj)
    })
});

// Create a Node.js based http server on port 8080
//var server = require('http').createServer(app).listen(process.env.PORT || 3000);
server.listen(9000, function() {
    console.log('localhost:9000');
});
// app.listen(3000,() => {
//     // console.log(__dirname+'\\logs\\access.log');
//      console.log('listening to 3000');
// })

// // Reduce the logging output of Socket.IO
// io.set('log level',1);