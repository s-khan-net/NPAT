var mainmodule = angular.module("app-npat",['timer','ngConfirm'])
mainmodule.factory('beforeUnload', function ($rootScope, $window) {
    // Events are broadcast outside the Scope Lifecycle
    
    $window.onbeforeunload = function (e) {
        var confirmation = {};
        var event = $rootScope.$broadcast('onBeforeUnload', confirmation);
        if (event.defaultPrevented) {
            return confirmation.message;
        }
    };
    
    $window.onunload = function () {
        $rootScope.$broadcast('onUnload');
    };
    return {};
})
.run(function (beforeUnload) {
    // Must invoke the service at least once
});

mainmodule.factory('socket', function($rootScope) {
    var socket = io.connect();
    return {
      on: function(eventName, callback) {
        socket.on(eventName, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            callback.apply(socket, args);
          });
        });
      },
      emit: function(eventName, data, callback) {
        socket.emit(eventName, data, function() {
          var args = arguments;
          $rootScope.$apply(function() {
            if(callback) {
              callback.apply(socket, args);
            }
          });
        });
      }
    };
  });

mainmodule.controller("game", function ($scope, $http,socket) {
    $scope.wait = false;
    $scope.waitPlace = false;
    $scope.waitAnimal = false;
    $scope.waitThing = false;

    $scope.nameVal=false;
    $scope.placeVal=false;
    $scope.animalVal=false;
    $scope.thingVal=false;
    $scope.playingGame = {
        name:'',
        place:'',
        animal:'',
        thing:'',
        namePoints:0,
        placePoints:0,
        animalPoints:0,
        thingPoints:0,
    }
    $scope.playerTime=0;
    $scope.gameTime=0;
    $scope.alphabet = ''

    var FullList = [];
    $scope.players =[];
    $scope.gameName='';
    $scope.games =[];
    $scope.game={};
    $scope.currentGameId='';
    $scope.currentPlayerId='';

    $scope.coverMessage='';
    $scope.htmlCoverMessage=''
    $scope.loaderMsg='...';
    $scope.gameStarted=false;

    const interval = 1000000;
    //get current games if any...
    refreshGameList();
    let loadGamesTimer = setInterval(() => {
        refreshGameList();
    }, interval);
    // let loadPlayerTimer = setInterval(function () {
    //     if(!$('#gameContainer').is(':visible'))
    //         refreshPlayerList();
    // }, interval); 

    $scope.refreshGames = function(){
        if(!$('.js-gamesLoad').hasClass('fa-spin'))
            refreshGameList()
    }
    function refreshGameList(){
        $('.js-gamesLoad').addClass('fa-spin');
        $http.get('/api/game')
        .then(function (result) {
            if(result.status==200){
                $scope.games=[];
                $.each(result.data.game,function(i,v){
                    if(v.gamePlayers.length<10 && (v.gameAlphabetArray.length==0 || v.gameAlphabetArray.length>5))
                        $scope.games.push(v);
                    else{
                        if(v.gameAlphabetArray.length>5){
                            let players=[];
                            $.each(v.gamePlayers,function(u,p){
                                if(p.isActive)
                                    players.push(p);
                            });
                            if(players.length<10){
                                let tempg={
                                    gameId:v.gameId,
                                    gameName:v.gameName,
                                    gameStarted:v.gameStarted,
                                    gameAlphabetArray:v.gameAlphabetArray,
                                    gameTime:v.gameTime,
                                    gamePlayers:players
                                };
                                $scope.games.push(tempg);
                            }
                        }
                    }
                })
                FullList = $scope.games;
            }
            else
                $scope.games = [];
            $('.js-gamesLoad').removeClass('fa-spin');
        },
        function(error){
            $('.js-gamesLoad').removeClass('fa-spin');
            alert(error.statusText);
            $scope.wait = false;
        });
    }
    $scope.gameSearchChanged = function () {
        $scope.games = $scope.searchGamesText ? performfilter($scope.searchGamesText) : FullList;
    }
    performfilter = function (searchtext) {
        filterby = searchtext.toLocaleLowerCase();
        return FullList.filter(function (game) {
            //var n =  game.gameName;
            return game.gameName.toLocaleLowerCase().indexOf(filterby) != -1;
        });
    }
    function refreshPlayerList(){
        $('.js-playerLoad').show();
        let gameId=$scope.currentGameId;//$('#hidGameId').val();
        $http.get('/api/game/'+gameId)
        .then(function (result) {
            if(result.status==200){
                $scope.game =result.data.game;
                //build players list
                $scope.players=[];
                $.each(result.data.game.gamePlayers,function(i,v){
                    let p = v.pointsForGame.reduce((a, b) => a + b, 0);
                    $scope.players.push({playerId:v.playerid,playerName:v.playerName,pointsForGame:p,isCreator:v.isCreator,playerAvatar:`images/avatars/${v.playerAvatar}`});
                })
            }
            else{
                
            }
            $('.js-playerLoad').hide();
        },
        function(error){
            $('.js-playerLoad').hide();
        });
    }

    $scope.gameStartedClass = function(v){
        return v?'fa fa-circle green':' fa fa-circle red';
    }
    $scope.createGame = function(){
        //create a new game
        let gameid = `G-${$scope.gameName.substring(0, 3)}-${uuidv4()}-${Date.now()}-${uuidv4()}`;
        let playerid = `P-${$scope.gameName.substring(0, 3)}-${$scope.playerName}-${Date.now()}-${$('#hidPlayerAv').val().split('.')[0]}`;
        let game = {
            gameId:gameid,
            gameName:$scope.gameName,
            gameTime:$scope.gameTime?$scope.gameTime:0,
            gameActive:true,
            gameStarted:false,
            gameStartedAt:0,
            gameEnded:false,
            gameEndedAt:0,
            gameAbandoned:false,
            gameSuspended:false,
            gameAlphabet:'',
            gameAlphabetArray:[],
            gamePlayers:[
                {
                    playerId:playerid,
                    playerName:$scope.playerName,
                    playerAvatar:$('#hidPlayerAv').val(),
                    isCreator:true,
                    pointsForGame:[],
                    wordsForGame:[],
                    joinedAt:Date.now(),
                    isActive:true
                }
            ]
        }
        //save to DB
        //call api to save
        $scope.loaderMsg='creating new game...'
        $scope.wait=true;
        $http.post('/api/game',JSON.stringify(game))
        .then(function (result) {
            if(result.status=='201'){
                //add to the game room 
                socket.emit('createGame',game);
                //game saved
                //build player list
                $scope.players=[];
                $scope.players.push({playerId:game.gamePlayers[0].playerId,playerName:game.gamePlayers[0].playerName,pointsForGame:0,isCreator:true,playerAvatar:`images/avatars/${game.gamePlayers[0].playerAvatar}`,me:true});
                $scope.currentPlayerId = `${playerid}~c`; //to indicate the creator
                $scope.currentGameId = gameid
                // $('#hidPlayerId').val(`${playerid}~c`); //to indicate the creator
                // $('#hidGameId').val(gameid);
                $scope.gameStarted = false;
                var styles = {
                    zIndex:2,
                    background:"rgb(225,255,255)",
                    background:"-moz-linear-gradient(top, rgba(225,255,255,1) 0%, rgba(225,255,255,1) 7%, rgba(225,255,255,1) 12%, rgba(253,255,255,1) 12%, rgba(230,248,253,1) 30%, rgba(200,238,251,1) 54%, rgba(190,228,248,1) 75%, rgba(177,216,245,1) 100%)",
                    background:"-webkit-linear-gradient(top, rgba(225,255,255,1) 0%,rgba(225,255,255,1) 7%,rgba(225,255,255,1) 12%,rgba(253,255,255,1) 12%,rgba(230,248,253,1) 30%,rgba(200,238,251,1) 54%,rgba(190,228,248,1) 75%,rgba(177,216,245,1) 100%)",
                    background:"linear-gradient(to bottom, rgba(225,255,255,1) 0%,rgba(225,255,255,1) 7%,rgba(225,255,255,1) 12%,rgba(253,255,255,1) 12%,rgba(230,248,253,1) 30%,rgba(200,238,251,1) 54%,rgba(190,228,248,1) 75%,rgba(177,216,245,1) 100%)",
                    filter:"progid:DXImageTransform.Microsoft.gradient( startColorstr='#e1ffff', endColorstr='#b1d8f5',GradientType=0 )",
                    width:"95%",//(Number($('#mainGameSection').css('width').split('p')[0])-20)+'px',
                    opacity:0.7,
                    height:"319px",//(Number($('#mainGameSection').css('height').split('p')[0])-20)+'px',
                    top:'43px',
                    position:'absolute',
                    paddingLeft:'57px',
                    paddingTop: '90px',
                    fontSize: 'large',
                    paddingRight: '19px',
                    color:'#00588b',
                    display:'block',
                    borderRadius: '5px',
                    border:'1px ridge #8ebfe3'  
                  };
                $('#cover').css(styles);
                
                $scope.coverMessage='The game is not started yet, <br>You need atleast <b>2</b> players to start the game. It is good to have <b>3 or more</b>.';
                $('#mainContainer').fadeIn(1000);
                $('#gameContainer').fadeOut(100);
                $scope.wait=false;
                clearInterval(loadGamesTimer);
            }
            else{
                $scope.wait = false;
                alert('Sorry, couldnt create the game... ');
            }
        },
        function(error){
            alert(error.statusText);
            $scope.wait = false;
        });
        
    }

    /*---- join game-----*/
    $scope.joinGame = function(gameId,gameName,totalGamePlayers){
       // console.log(gameId);
       if(totalGamePlayers<10){
            $scope.gameName = gameName;
            $scope.wait=true;
            $scope.loaderMsg='Joining game...';
            var playerId = `P-${gameName.substring(0, 3)}-${$scope.playerName}-${Date.now()}-${$('#hidPlayerAv').val().split('.')[0]}`;
            var obj={
                gameId:gameId,
                playerId:playerId,
                playerName:$scope.playerName,
                playerAvatar:$('#hidPlayerAv').val()
            };
            clearInterval(loadGamesTimer);
            $scope.currentPlayerId = playerId;
            $scope.currentGameId = gameId;
            // $('#hidPlayerId').val(playerId);
            // $('#hidGameId').val(gameId);
            socket.emit('joinGame', obj);
        }
        else{
            alert('This game has 10 players\n Sorry, pick another one');
        }
    }
    socket.on('joined',function(data) {
        if(data.err!=''){
            console.log('game join err');
            alert(`Some error occured while starting the game\n please try again :${data.err}`);
        }
        else{
            let p='';
            let x='admin';
            $scope.gameStarted = data.gameStarted;
            if($scope.players.length==0){
                data.gamePlayers.forEach(player => {
                    if(player.isCreator)
                        x=player.playerName;
                    if($scope.currentPlayerId.split('~')[0] == player.playerId){
                        p=player.playerName;
                    }
                    //let a = player.pointsForGame.reduce((a, b) => a + b, 0)
                    player.pointsForGame = player.pointsForGame.reduce((a, b) => a + b, 0);// a==0?'':a;
                    player.playerAvatar = `images/avatars/${player.playerAvatar}`;
                    if(!data.gameStarted)
                        player.playerTyping=''; 
                    else{
                        if(player.wordsForGame.length==data.gameAlphabetArray.length)
                            player.playerTyping='';     
                        else 
                            player.playerTyping='S'; 
                    }
                    player.me=$scope.currentPlayerId.split('~')[0] == player.playerId?true:false
                });
                $scope.players=data.gamePlayers;
            }
            else{
                var player;
                $.each(data.gamePlayers,function(i,v){
                    if($scope.players.indexOf(v)==-1){
                        player = {
                           playerId:v.playerId,
                           playerName:v.playerName,
                           pointsForGame:0,
                           playerAvatar:`images/avatars/${v.playerAvatar}`,
                           playerTyping:'',
                           me:$scope.currentPlayerId.split('~')[0] == v.playerId?true:false
                        }
                    }
                });
                $scope.players.push(player);
            }
            var styles = {
                zIndex:2,
                background:"rgb(225,255,255)",
                background:"-moz-linear-gradient(top, rgba(225,255,255,1) 0%, rgba(225,255,255,1) 7%, rgba(225,255,255,1) 12%, rgba(253,255,255,1) 12%, rgba(230,248,253,1) 30%, rgba(200,238,251,1) 54%, rgba(190,228,248,1) 75%, rgba(177,216,245,1) 100%)",
                background:"-webkit-linear-gradient(top, rgba(225,255,255,1) 0%,rgba(225,255,255,1) 7%,rgba(225,255,255,1) 12%,rgba(253,255,255,1) 12%,rgba(230,248,253,1) 30%,rgba(200,238,251,1) 54%,rgba(190,228,248,1) 75%,rgba(177,216,245,1) 100%)",
                background:"linear-gradient(to bottom, rgba(225,255,255,1) 0%,rgba(225,255,255,1) 7%,rgba(225,255,255,1) 12%,rgba(253,255,255,1) 12%,rgba(230,248,253,1) 30%,rgba(200,238,251,1) 54%,rgba(190,228,248,1) 75%,rgba(177,216,245,1) 100%)",
                filter:"progid:DXImageTransform.Microsoft.gradient( startColorstr='#e1ffff', endColorstr='#b1d8f5',GradientType=0 )",
                width:"95%",//(Number($('#mainGameSection').css('width').split('p')[0])-20)+'px',
                opacity:0.7,
                height:"319px",//(Number($('#mainGameSection').css('height').split('p')[0])-20)+'px',
                top:'43px',
                position:'absolute',
                paddingLeft:'57px',
                paddingTop: '90px',
                fontSize: 'large',
                paddingRight: '19px',
                color:'#00588b',
                display:'block',
                borderRadius: '5px',
                border:'1px ridge #8ebfe3'
            };

            if(!$scope.gameStarted){
                $('#cover').css(styles);
                if($scope.currentPlayerId.indexOf('~')>-1)
                    $scope.coverMessage=`The game is not started yet, <b>you</b> can start the game`;
                else
                    $scope.coverMessage=`The game is not started yet, waiting for <b>${x}</b> to start the game`;
            }
            else{
                //if($('#hidPlayerId').val().split('~')[0] == data.playerId){
                if($scope.currentPlayerId.split('~')[0] == data.playerId){
                    $('#cover').css(styles);
                    $scope.coverMessage=`You have missed ${26-data.gameAlphabetArray.length} ${26-data.gameAlphabetArray.length>1?'alphabets':'alphabet'}, <br>please wait until a new play begins`;
                    setTimeout(() => {
                        let submitObj={
                            gameId:$scope.currentGameId,//$('#hidGameId').val(),
                            playerId:$scope.currentPlayerId.split('~')[0],// $('#hidPlayerId').val().split('~')[0],
                            words:[],
                            pointsForGame:0
                          }
                        socket.emit('submit', submitObj);
                    }, 900);
                }
            }
            $('#mainContainer').fadeIn(1000);
            $('#gameContainer').fadeOut(100);
            if($(window).width()>1000){
                $('#btnChat #btnChat').hide();
            }
            else{
                $('#btnChat #btnChat').show();
            }
              
            $scope.wait=false;
            $('#divStatus').text(`${p} has joined`).fadeIn('slow').fadeOut(5000);
        }
    });

    /*----- chat ----*/
    $scope.message = function(){
        if($('#txtMsg').val().length>0){
            var obj={playerId:$scope.currentPlayerId,gameId:$scope.currentGameId,message:$('#txtMsg').val()};
            //var obj ={playerId:$('#hidPlayerId').val(),gameId:$('#hidGameId').val(),message:$('#txtMsg').val()};
            $('#txtMsg').val('');
            socket.emit('message', obj);
        }
    }
    socket.on('onMessage',function(data){
        $('#chatbox').append(`<div style='border:1px solid #ddd;padding:3px;margin-top: 2px;margin-left:-22px;margin-right: 2px;background-color: white;border-radius: 7px;'>${data.playerName}&nbsp;<img src="${data.playerAvatar}" width=30 />&nbsp;:&nbsp;${data.message}</div>`);
    })

    /*-----wait from socket----*/
    socket.on('onWait',function(msg){
        if(msg){$scope.loaderMsg=msg}
        $scope.wait=true;
    });
    socket.on('onStopWait',function(data){
        $scope.wait=false;
    });

    /*----------play start-------------- */
    $scope.playStart = function(){
        //if($('#hidPlayerId').val().indexOf('~')>-1)
        if($scope.currentPlayerId.indexOf('~')>-1)
            socket.emit('playStarted', $scope.currentGameId);
            //socket.emit('playStarted', `${$('#hidGameId').val()}`);
    }
    socket.on('onPlayStarted',function(data){
        if(data.err!=''){
            console.log('game start err');
            alert('Some error occured while starting the game\n please try again');
        }
        else{
            //change icon
            //if($('#hidGameId').val() == data.gameId){
            if($scope.currentGameId == data.gameId){ //not needed to check
                $scope.alphabet = data.alphabet;
                $scope.gameStarted = data.gameStarted;
                $scope.gameTime = data.gameTime;
                console.log('game start evt');
                $('#gameStartedIndicator').hide();
                $('#gameTimer').show();
                $('#cover').fadeOut();
                $scope.$broadcast('timer-set-countdown',data.gameTime);
                $scope.$broadcast('timer-start');
                
            }  
        }
    });

    /*--------------------typing--------------- */
    socket.on('onTyping',function(data){
    //if($('#hidGameId').val() == data[0]){
        $.each($scope.players,function(i,v){
            if(v.playerId == data[1]){
                v.playerTyping = `${data[2]}`
            }
        });
    //}
    });

    /*-------------points change--------------- */
    socket.on('onPoints',function(data){
    //if($('#hidGameId').val() == data[0]){
        $.each($scope.players,function(i,v){
            if(v.playerId == data.playerId){
                v.pointsForGame =  data.pointsForGame;
                //switch (data[3]) {
                //     case 'N':
                //         $scope.playingGame.namePoints = data[2]
                //         break;
                //     case 'P':
                //         $scope.playingGame.placePoints = data[2]
                //         break;
                //     case 'A':
                //         $scope.playingGame.animalPoints = data[2]
                //         break;
                //     case 'T':
                //         $scope.playingGame.thingPoints = data[2]
                //         break;
                //     default:
        
                //         break;
                // }
                // v.pointsForGame = Number($scope.playingGame.namePoints) + Number($scope.playingGame.placePoints)+ Number($scope.playingGame.animalPoints) + Number($scope.playingGame.thingPoints);
            }
        });
    //}
        
    });

    /*--------------submit play--------------- */
    $scope.$on('timer-stopped', function (event, data){
        console.log('Timer Stopped - data = ', data);
        $scope.playerTime =data.seconds;
        if(data.seconds==0) //update only if not submitted
            submitGameWOStop();
    });

    $scope.submitGame = function(){
      $scope.$broadcast('timer-stop');
      $scope.loaderMsg='submitting...'
      $scope.wait=true;
      
      let wordsArray={
        name:$scope.playingGame.name,namePoints:$scope.playingGame.namePoints,
        place:$scope.playingGame.place,placePoints:$scope.playingGame.placePoints,
        animal:$scope.playingGame.animal,animalPoints:$scope.playingGame.animalPoints,
        thing:$scope.playingGame.thing,thingPoints:$scope.playingGame.thingPoints,
        bonusPoints:getBonus(),playTime:$scope.playerTime,
      }
      let submitObj={
        gameId:$scope.currentGameId,//$('#hidGameId').val(),
        playerId:$scope.currentPlayerId.split('~')[0],//$('#hidPlayerId').val().split('~')[0],
        words:wordsArray,
        pointsForGame:Number($scope.playingGame.namePoints) + Number($scope.playingGame.placePoints)+ Number($scope.playingGame.animalPoints) + Number($scope.playingGame.thingPoints)
      }
      socket.emit('submit', submitObj);
    }
    submitGameWOStop = function(){
        //$scope.$broadcast('timer-stop');
		console.log('submitting as timer is 0');
        
        $scope.loaderMsg='Time is up! submitting...'
        $scope.wait=true;
        let wordsArray={
          name:$scope.playingGame.name,namePoints:$scope.playingGame.namePoints,
          place:$scope.playingGame.place,placePoints:$scope.playingGame.placePoints,
          animal:$scope.playingGame.animal,animalPoints:$scope.playingGame.animalPoints,
          thing:$scope.playingGame.thing,thingPoints:$scope.playingGame.thingPoints,
          bonusPoints:getBonus(),playTime:$scope.playerTime,
        }
        let submitObj={
          gameId:$scope.currentGameId,//$('#hidGameId').val(),
          playerId:$scope.currentPlayerId.split('~')[0],//$('#hidPlayerId').val().split('~')[0],
          words:wordsArray,
          pointsForGame:Number($scope.playingGame.namePoints) + Number($scope.playingGame.placePoints)+ Number($scope.playingGame.animalPoints) + Number($scope.playingGame.thingPoints)
        }
        socket.emit('submit', submitObj);
    }
    socket.on('onSubmit',function(data){
        //$scope.coverMessage=$scope.coverMessage.indexOf('missed')==-1?'':$scope.coverMessage;
        if($scope.coverMessage.indexOf('missed')==-1)
            $scope.coverMessage=''
        if(data.err!=''){
            console.log('game submit err');
            alert(`Some error occured while submitting\n please try again :${data.err}`);
        }
        else{
            let c=0;
            $.each($scope.players,function(i,v){
                if(v.playerId == data.playerId){
                    v.playerTyping = 'S';
                    // if(v.pointsForGame==''){
                    //     v.pointsForGame = data.pointsForGame;
                    // }
                    // else{
                        v.pointsForGame = Number(v.pointsForGame)+Number(data.pointsForGame);
                    //}
                }
                if(v.playerTyping=='S')
                c++;
            });
            //if($('#hidPlayerId').val().split('~')[0]==data.playerId){
            if($scope.currentPlayerId.split('~')[0]==data.playerId){
                var styles = {
                    zIndex:2,
                    background:"rgb(225,255,255)",
                    background:"-moz-linear-gradient(top, rgba(225,255,255,1) 0%, rgba(225,255,255,1) 7%, rgba(225,255,255,1) 12%, rgba(253,255,255,1) 12%, rgba(230,248,253,1) 30%, rgba(200,238,251,1) 54%, rgba(190,228,248,1) 75%, rgba(177,216,245,1) 100%)",
                    background:"-webkit-linear-gradient(top, rgba(225,255,255,1) 0%,rgba(225,255,255,1) 7%,rgba(225,255,255,1) 12%,rgba(253,255,255,1) 12%,rgba(230,248,253,1) 30%,rgba(200,238,251,1) 54%,rgba(190,228,248,1) 75%,rgba(177,216,245,1) 100%)",
                    background:"linear-gradient(to bottom, rgba(225,255,255,1) 0%,rgba(225,255,255,1) 7%,rgba(225,255,255,1) 12%,rgba(253,255,255,1) 12%,rgba(230,248,253,1) 30%,rgba(200,238,251,1) 54%,rgba(190,228,248,1) 75%,rgba(177,216,245,1) 100%)",
                    filter:"progid:DXImageTransform.Microsoft.gradient( startColorstr='#e1ffff', endColorstr='#b1d8f5',GradientType=0 )",
                    width:(Number($('#mainGameSection').css('width').split('p')[0])-20)+'px',
                    opacity:0.7,
                    height:(Number($('#mainGameSection').css('height').split('p')[0])-20)+'px',
                    top:'43px',
                    position:'absolute',
                    paddingLeft:'57px',
                    paddingTop: '90px',
                    fontSize: 'large',
                    paddingRight: '19px',
                    color:'#00588b',
                    display:'block',
                    borderRadius: '5px',
                    border:'1px ridge #8ebfe3'
                };
                $('#cover').css(styles);
                if($scope.players.length==c && data.gameAlphabetArray != undefined){
                    //everyone has submitted so 
                    if(data.gameAlphabetArray.length<26){ //this can be undefined as well
                        $scope.coverMessage='Everyone submitted, starting new play...';
                        setTimeout(() => {
                            //if($('#hidPlayerId').val().indexOf('~')>-1){ BIG BUGGY CODE! cost me a day!!!
                                socket.emit('newPlay', data.gameId);  
                           // }    
                        }, 3300);
                    }
                    else{
                        $scope.coverMessage='Everyone submitted, game over... Wait for the leaderboard...';
                        setTimeout(() => {
                            //if($('#hidPlayerId').val().indexOf('~')>-1){
                                socket.emit('endGame', data.gameId);  
                            //}    
                        }, 3300);
                    }
                    //$scope.wait=false;
                }
                else{
                    if($scope.coverMessage.indexOf('missed')>-1)
                        $scope.coverMessage +=', waiting for everyone to submit';
                    else
                        $scope.coverMessage='Waiting for everyone to submit';
                }
            }
            if($('#cover').css('display')=='block'){
                if($scope.players.length==c && data.gameAlphabetArray != undefined){
                    //everyone has submitted so 
                    $scope.coverMessage='Everyone submitted';
                // $scope.wait=true;
                   // setTimeout(function() {
                        if(data.gameAlphabetArray.length<26 ){
                            $scope.coverMessage='Everyone submitted, starting new play...';
                            //socket.emit('newPlay', data.gameId);  
                        }
                        else
                        $scope.coverMessage='Everyone submitted, game over... Wait for the leaderboard...';
                        //$scope.wait=false;
                    //}, 1300);
                }
                else{
                    if($scope.coverMessage.indexOf('waiting for everyone to submit')==-1)
                        $scope.coverMessage +='Waiting for everyone to submit';
                }
            }
        }
        $scope.wait=false;
        $scope.loaderMsg='loading...';
    });

    getBonus = function(){
        return (($scope.playerTime/$scope.gameTime) * 100).toFixed(1) + '%'
    }

    /*-----------new play------------------ */
    socket.on('onNewPlay',function(data){
        $.each($scope.players,function(i,v){
          v.playerTyping='';
        });
        if(data.err!=''){
          console.log('game start err');
          alert('Some error occured while starting the game\n please try again');
        }
        else{
          //change icon
          //if($('#hidGameId').val() == data.gameId){
          if($scope.currentGameId == data.gameId){
            $scope.gameTime = data.gameTime;
            $scope.playingGame.name='';
            $scope.playingGame.place='';
            $scope.playingGame.animal='';
            $scope.playingGame.thing='';
            $scope.playingGame.namePoints=0;
            $scope.playingGame.placePoints=0;
            $scope.playingGame.animalPoints=0;
            $scope.playingGame.thingPoints=0;
            $scope.alphabet = data.alphabet;
            $('#gameStartedIndicator').hide();
            $('#gameTimer').show();
            $('#cover').fadeOut();
            $scope.$broadcast('timer-set-countdown',data.gameTime);
            $scope.$broadcast('timer-start');
            $scope.wait=false;
            $scope.loaderMsg='loading...';
          }  
        }
    });

    /*----------------leave game------------ */
    $scope.leaveGame = function(){
        console.log('leavin');
        if($scope.currentPlayerId.indexOf('~')>-1 && !$scope.gameStarted){
            alert('You are the admin, you cannot leave');
        }
        else{
            socket.emit('leave', {gameId:$scope.currentGameId,playerId:$scope.currentPlayerId.split('~')[0]});
            $('#mainContainer').fadeOut(100);
            $('#gameContainer').fadeIn(1000);
            refreshGameList();
            $scope.wait=false;
            $scope.loaderMsg='Loading...';
        }
    }
    socket.on('onLeave',function(data){
        // if(data.err!=''){
        //     console.log('game leave err');
        //     //alert(`Some error occured while leavi the game\n please try again :${data.err}`);
        // }
        // else{
            let p='';
            if($scope.players.length>1){
                var index=0;
                $.each($scope.players,function(i,v){
                    if(v.playerId == data.playerId){
                        p = v.playerName;
                        if(v.isCreator){
                            //admin left!
                            $scope.wait=true;
                            $scope.loaderMsg='Admin left...';
                            socket.emit('admin', {gameId:$scope.currentGameId});
                        }
                        index=i;
                    }
                });
                $scope.players.splice(index,1);
                $('#divStatus').text(`${p} has left`).fadeIn('slow').fadeOut(5000);
            }
            else{
                socket.emit('abandon', {gameId:$scope.currentGameId});
            }
        //}
    })

    /*------------end game------------------ */
    socket.on('onEndGame',function(data){
        $scope.$broadcast('timer-stop');
        $.each($scope.players,function(i,v){
            v.playerTyping='';
        });
        if(data.err!=''){
            console.log('game end err');
            alert('Some error occured while ending the game\n please try again');
        }
        else{
            let coverMsg='';
            $.each(data.gamePlayers,function(i,v){
                let p=0;
                $.each(v.wordsForGame,function(j,w){
                    p = w.namePoints + w.placePoints + w.animalPoints + w.thingPoints;
                    p += (p/100) * Number(w.bonusPoints.split('%')[0]); 
                });
                coverMsg +=` ${v.playerName}: ${p} points<br>`;
            });
            coverMsg = coverMsg.substr(0,coverMsg.length-1);
            if($('#cover').css('display')=='block'){
                $scope.coverMessage = coverMsg;
            }
            else{
                var styles = {
                    zIndex:2,
                    background:"rgb(225,255,255)",
                    background:"-moz-linear-gradient(top, rgba(225,255,255,1) 0%, rgba(225,255,255,1) 7%, rgba(225,255,255,1) 12%, rgba(253,255,255,1) 12%, rgba(230,248,253,1) 30%, rgba(200,238,251,1) 54%, rgba(190,228,248,1) 75%, rgba(177,216,245,1) 100%)",
                    background:"-webkit-linear-gradient(top, rgba(225,255,255,1) 0%,rgba(225,255,255,1) 7%,rgba(225,255,255,1) 12%,rgba(253,255,255,1) 12%,rgba(230,248,253,1) 30%,rgba(200,238,251,1) 54%,rgba(190,228,248,1) 75%,rgba(177,216,245,1) 100%)",
                    background:"linear-gradient(to bottom, rgba(225,255,255,1) 0%,rgba(225,255,255,1) 7%,rgba(225,255,255,1) 12%,rgba(253,255,255,1) 12%,rgba(230,248,253,1) 30%,rgba(200,238,251,1) 54%,rgba(190,228,248,1) 75%,rgba(177,216,245,1) 100%)",
                    filter:"progid:DXImageTransform.Microsoft.gradient( startColorstr='#e1ffff', endColorstr='#b1d8f5',GradientType=0 )",
                    width:(Number($('#mainGameSection').css('width').split('p')[0])-20)+'px',
                    opacity:0.7,
                    height:(Number($('#mainGameSection').css('height').split('p')[0])-20)+'px',
                    top:'43px',
                    position:'absolute',
                    paddingLeft:'57px',
                    paddingTop: '90px',
                    fontSize: 'large',
                    paddingRight: '19px',
                    color:'#00588b',
                    display:'block',
                    borderRadius: '5px',
                    border:'1px ridge #8ebfe3'
                };
                $('#cover').css(styles);
                $scope.coverMessage =coverMsg;
            }
        }
    });

    /*------on random admin creation----------*/
    socket.on('onAdmin',function(data){
        let p='';
        $.each($scope.players,function(i,v){
            if(v.playerId == data.playerId){
                //admin is..
                p=v.playerName;
                v.isCreator=true;
                if($scope.currentPlayerId == data.playerId){
                    $scope.currentPlayerId = $scope.currentPlayerId + '~c'; //is admin
                    $scope.loaderMsg = 'You are the admin now';
                }
                else{
                    $scope.loaderMsg = `${p} is the admin now`;
                }
            }
        });
        setTimeout(() => {
            $scope.wait=false;
        }, 2000);
    })
    /**------ng-classes---------------------*/
    $scope.gameStartedIndicatorClass = function(){
        //if($('#hidPlayerId').val().split('~')[1]=='c'){
        if($scope.currentPlayerId.split('~')[1]=='c'){
            if($scope.players.length>=2)
                return 'fa fa-play fa-lg btn btn-default';
            else
                return $scope.game.gameStarted?'fa fa-play fa-lg':'fa fa-clock-o fa-spin';
        }
        else{
            return $scope.game.gameStarted?'fa fa-play fa-lg':'fa fa-clock-o fa-spin';
        }
    }
    $scope.gameCompletedClass = function(v){
        switch (v) {
            case 0:
            case 1:
            case 2:
            case 3:
                return 'fa fa-battery-0 red';
                break;
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
                return 'fa fa-battery-1 red';
                break;
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
                return 'fa fa-battery-2 orange';
                break;
            case 14:
            case 15:
            case 16:
            case 17:
                return 'fa fa-battery-3 blue';
            case 18:
            case 19:
            case 20:
                return 'fa fa-battery-4 blue';
            default:
                return 'fa fa-battery-4 green';
                break;
        }
    }
    $scope.typingClass = function(v){
        switch (v) {
            case 'N':
                return 'fa fa-commenting-o blinker red';
                break;
            case 'P':
                return 'fa fa-commenting-o blinker green';
                break;
            case 'A':
                return 'fa fa-commenting-o blinker brown';
                break;
            case 'T':
                return 'fa fa-commenting-o blinker blue';
                break;
            case 'S':
                return 'fa fa fa-check-square';
                break;
            default:
                return '';
                break;
        }
    }
    $scope.meClass = function(me){
        if(me)
            return 'fa fa-user-o green'
    }

    /*----validate name-----*/
    $scope.ValName = function(v){
        socket.emit('typing', `${$scope.currentGameId}~${$scope.currentPlayerId.split('~')[0]}~N`);
        //socket.emit('typing', `${$('#hidGameId').val()}~${$('#hidPlayerId').val().split('~')[0]}~N`);
        let s='';
        if($scope.playingGame.name) {
            $scope.playingGame.name = $scope.playingGame.name.replace(/[1234567890`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
            s = $scope.playingGame.name.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.playingGame.name = '';
                $scope.playingGame.namePoints=0;
                $('.js-alphabet').css('color','red');
                $('.js-alphabet').addClass('vibrate');
                setTimeout(()=>{
                    $('.js-alphabet').removeAttr('style');
                    $('.js-alphabet').removeClass('vibrate');
                },540);
            }
            else{
                //validate name
                if($scope.playingGame.name.length>=4){
                    let vc = vowel_count($scope.playingGame.name);
                    if(vc>0 && vc<$scope.playingGame.name.length ){
                        $scope.nameVal = true;
                        $scope.playingGame.namePoints=4;
                    }
                    else{
                        $scope.nameVal = false;
                        $scope.playingGame.namePoints=0;
                    }
                }
                else{
                    $scope.nameVal = false;
                    $scope.playingGame.namePoints=0;
                }
                
            }
        }
    }
    $scope.nameValid = function () {
        if($('#txtName').val().length>=1)
            return $scope.nameVal ? 'fa fa-check-circle green' : 'fa fa-close red';
    }

    /*-----validate place-------------*/
    $scope.ValPlace = function(v){
        socket.emit('typing', `${$scope.currentGameId}~${$scope.currentPlayerId.split('~')[0]}~P`);
        //socket.emit('typing', `${$('#hidGameId').val()}~${$('#hidPlayerId').val().split('~')[0]}~P`);
        let s='';
        if($scope.playingGame.place) {
            $scope.playingGame.place = $scope.playingGame.place.replace(/[1234567890`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
            s = $scope.playingGame.place.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.playingGame.place = '';
                $scope.playingGame.placePoints=0;
                $('.js-alphabet').css('color','red');
                $('.js-alphabet').addClass('vibrate');
                setTimeout(()=>{
                    $('.js-alphabet').removeAttr('style');
                    $('.js-alphabet').removeClass('vibrate');
                },540);
            }
            else{
                //validate place
                if($scope.playingGame.place.length>=3){
                    let vc = vowel_count($scope.playingGame.place);
                    if(vc>0 && vc<$scope.playingGame.place.length ){
                        //call api to check
                        $scope.waitPlace=true;
                        $http.get('api/words/place/'+$scope.playingGame.place)
                        .then(function (result) {
                            $scope.waitPlace = false;
                            if(result.data) {
                                $scope.placeVal = true;
                                if($scope.playingGame.place.length<=4)
                                    $scope.playingGame.placePoints = 4;
                                else if($scope.playingGame.place.length==5)
                                    $scope.playingGame.placePoints = 5;
                                else if($scope.playingGame.place.length==6)
                                    $scope.playingGame.placePoints = 6;
                                else if($scope.playingGame.place.length==7)
                                    $scope.playingGame.placePoints = 7;
                                else if($scope.playingGame.place.length>=8)
                                    $scope.playingGame.placePoints = 9;
                                    
                            }
                            else {
                                $scope.placeVal = false;
                                $scope.playingGame.placePoints = 0;
                            }
                            
                        },
                        function(error){
                            alert(error.statusText+'Error connecting to server');
                            $scope.waitPlace = false;
                        });
                    }
                    else{
                        $scope.placeVal = false;
                    }
                }
                else{
                    $scope.placeVal = false;
                }
            }
        }
    }
    $scope.placeValid = function () {
        let c=''
        if($('#txtPlace').val().length>=1){
            if($scope.waitPlace==true) c='fa fa-spinner fa-spin grey';
            else if($scope.placeVal==true) c='fa fa-check-circle green';
            else if($scope.placeVal==false) c='fa fa-close red';
        }
        return c;
    }

    /*-----validate animal----*/
    $scope.ValAnimal = function(v){
        socket.emit('typing', `${$scope.currentGameId}~${$scope.currentPlayerId.split('~')[0]}~A`);
        //socket.emit('typing', `${$('#hidGameId').val()}~${$('#hidPlayerId').val().split('~')[0]}~A`);
        let s='';
        if($scope.playingGame.animal) {
            $scope.playingGame.animal = $scope.playingGame.animal.replace(/[1234567890`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
            s = $scope.playingGame.animal.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.playingGame.animal = '';
                $scope.playingGame.animalPoints =0;
                $('.js-alphabet').css('color','red');
                $('.js-alphabet').addClass('vibrate');
                setTimeout(()=>{
                    $('.js-alphabet').removeAttr('style');
                    $('.js-alphabet').removeClass('vibrate');
                },540);
            }
            else{
                //validate animal
                if($scope.playingGame.animal.length>=3){
                    let vc = vowel_count($scope.playingGame.animal);
                    if(vc>0 && vc<$scope.playingGame.animal.length ){
                        //call api to check
                        $scope.waitAnimal=true;
                        $http.get('api/words/animal/'+$scope.playingGame.animal)
                        .then(function (result) {
                            $scope.waitAnimal = false;
                            if(result.data) {
                                $scope.animalVal = true;
                                if($scope.playingGame.animal.length<=4)
                                    $scope.playingGame.animalPoints = 4;
                                else if($scope.playingGame.animal.length==5)
                                    $scope.playingGame.animalPoints = 5;
                                else if($scope.playingGame.animal.length==6)
                                    $scope.playingGame.animalPoints = 6;
                                else if($scope.playingGame.animal.length==7)
                                    $scope.playingGame.animalPoints = 7;
                                else if($scope.playingGame.animal.length>=8)
                                    $scope.playingGame.animalPoints = 9;
                            }
                            else {
                                $scope.playingGame.animalPoints = 0;
                                $scope.animalVal = false;
                            }
                            
                        },
                        function(error){
                            alert(error.statusText);
                            $scope.waitAnimal = false;
                        });
                    }
                    else{
                        $scope.animalVal = false;
                    }
                }
                else{
                    $scope.animalVal = false;
                }
            }
        }
    }
    $scope.animalValid = function () {
        let c=''
        if($('#txtAnimal').val().length>=1){
            if($scope.waitAnimal==true) c='fa fa-spinner fa-spin grey';
            else if($scope.animalVal==true) c='fa fa-check-circle green';
            else if($scope.animalVal==false) c='fa fa-close red';
        }
        return c;
    }

    /*------validate thing-----*/
    $scope.ValThing = function(v){
        socket.emit('typing', `${$scope.currentGameId}~${$scope.currentPlayerId.split('~')[0]}~T`);
        //socket.emit('typing', `${$('#hidGameId').val()}~${$('#hidPlayerId').val().split('~')[0]}~T`);
        let s='';
        if($scope.playingGame.thing) {
            $scope.playingGame.thing = $scope.playingGame.thing.replace(/[1234567890`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
            s = $scope.playingGame.thing.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.playingGame.thing = '';
                $scope.playingGame.animalPoints=0;
                $('.js-alphabet').css('color','red');
                $('.js-alphabet').addClass('vibrate');
                setTimeout(()=>{
                    $('.js-alphabet').removeAttr('style');
                    $('.js-alphabet').removeClass('vibrate');
                },540);
            }
            else{
                //validate animal
                if($scope.playingGame.thing.length>=3){
                    let vc = vowel_count($scope.playingGame.thing);
                    if(vc>0 && vc<$scope.playingGame.thing.length ){
                        //call api to check
                        $scope.waitThing=true;
                        $http.get('api/words/thing/'+$scope.playingGame.thing)
                        .then(function (result) {
                            $scope.waitThing = false;
                            if(result.data) {
                                $scope.thingVal = true;
                                $scope.playingGame.thingPoints=4;
                            }
                            else {
                                $scope.thingVal = false;
                                $scope.playingGame.thingPoints=0;
                            }
                            
                        },
                        function(error){
                            alert(error.statusText);
                            $scope.waitThing = false;
                        });
                    }
                    else{
                        $scope.thingVal = false;
                    }
                }
                else{
                    $scope.thingVal = false;
                }
            }
        }
    }
    $scope.thingValid = function () {
        let c=''
        if($('#txtThing').val().length>=1){
            if($scope.waitThing==true) c='fa fa-spinner fa-spin grey';
            else if($scope.thingVal==true) c='fa fa-check-circle green';
            else if($scope.thingVal==false) c='fa fa-close red';
        }
        return c;
    }

    function uuidv4() {
        return Math.random().toString(36).split('.')[1].substr(0,4)
    }
    function vowel_count(str1){
        var vowel_list = 'aeiouAEIOU';
        var vcount = 0;
        
        for(var x = 0; x < str1.length ; x++)
        {
            if (vowel_list.indexOf(str1[x]) !== -1)
            {
                vcount += 1;
            }
        
        }
        return vcount;
    }

    $scope.$on('onBeforeUnload', function (e, confirmation) {
        confirmation.message = "All data willl be lost.";
        e.preventDefault();
    });
    $scope.$on('onUnload', function (e) {
        console.log('leaving page'); // Use 'Preserve Log' option in Console
        socket.emit('leave', {gameId:$scope.currentGameId,playerId:$scope.currentPlayerId.split('~')[0]});
        //socket.emit('leave',{gameId:$('#hidGameId').val(),playerId:$('#hidPlayrId').val().split('~')[0]});
    });
});