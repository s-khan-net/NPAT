const express = require('express');
const config = require('config');
const users =require('./routes/users');
const words =require('./routes/words');
const game =require('./routes/game');
const Joi = require('joi');
const mongoose = require('mongoose');
const {Game, validate} = require('./models/game');
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

mongoose.connect('mongodb://localhost/NPAT')
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

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
    console.log(`someone connected ${socket.id}`);

    socket.on('createGame', function(obj) { //is whole game
        socket.join(`game-${obj.gameId}`);
    });

    socket.on('joinGame', function(obj) { // is game id
        const p = new Promise((resolve,reject)=>{
      //  console.log(obj);
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
            Game.findOne({gameId:obj.gameId},function(err,game){
                if(err){
                    var d = {err:'could not start, please try again'}
                    resolve(d);
                }
                else{
                    if(!game.gameEnded && game.gameActive){
                        game.gamePlayers.push(player); //add player to the game
                        game.save()
                            .then(g=>{
                                 var d = {gameId:g.gameId,gamePlayers:g.gamePlayers,gameTime:g.gameTime,gameStarted:g.gameStarted,gameStartedAt:g.gameStartedAt,gameAlphabetArray:g.gameAlphabetArray,err:''};
                                socket.join(`game-${g.gameId}`);
                                resolve(d);
                            }) // save the game
                            .catch(err=>{
                                var d = {err:'could not join, please try again'}
                                resolve(d);
                            })
                        
                    }else{
                        var d = {gameId:g.gameId,gamePlayers:g.gamePlayers,gameTime:g.gameTime,err:'game ended, please choose another one'};
                        resolve(d);
                    }
                }
            });
        }
        else{
                var d = {err:'game id or player id not obtained'};
                resolve(d);
            }
		});
		p.then(data=>{
            io.sockets.in(`game-${data.gameId}`).emit('joined', data)
        }).catch(err=>{
            var data = {err:'could not join, please try again'}
            io.sockets.in(`game-${data.gameId}`).emit('joined', data)
        })
    });

    socket.on('message',function(obj){
        io.sockets.in(`game-${obj.gameId}`).emit('onMessage',{playerName:obj.playerId.split('-')[2],playerAvatar:`images/avatars/${obj.playerId.split('-')[4]}.png`,message:obj.message});
    });

    socket.on('typing', function(val) { 
		val = val.split('~');
		socket.broadcast.to(`game-${val[0]}`).emit('onTyping', val);
    });

    socket.on('points', function(val) { 
		val = val.split('~');
		io.sockets.in(`game-${val[0]}`).emit('onPoints', val);
    });
    
    socket.on('playStarted', function(gameId) { 
		let msg='Starting game...';
        io.sockets.in(`game-${gameId}`).emit('onWait',msg); //send wait for everyone in the game
        const p = new Promise((resolve,reject)=>{
            //get the game
            Game.findOne({gameId:gameId},function(err,game){
                if(err){
                    var d = {err:'could not start, please try again'}
                    io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                    resolve(d);
                }
                else{
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
                            var d = {gameId:g.gameId,alphabet:a,alphabetArray:g.gameAlphabetArray,gameTime:g.gameTime,gameStarted:g.gameStarted,gameStartedAt:g.gameStartedAt,err:''};
                            resolve(d);
                        })
                        .catch(err=>{
                            var d = {err:'could not start, please try again'}
                            io.sockets.in(`game-${gameId}`).emit('onStopWait',err);
                            resolve(d);
                        });
                }
            });
		});
		
		p.then((data)=>{
			io.sockets.in(`game-${gameId}`).emit('onStopWait',msg); //stop waiting for everyone in the game
			io.sockets.in(`game-${gameId}`).emit('onPlayStarted',data);
		})
	});
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