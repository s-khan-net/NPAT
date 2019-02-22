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
    $scope.wait = true;
    $scope.waitPlace = false;
    $scope.waitAnimal = false;
    $scope.waitThing = false;

    $scope.nameVal=false;
    $scope.placeVal=false;
    $scope.animalVal=false;
    $scope.thingVal=false;
    $scope.alphabet = ''
    $scope.players =[];
    $scope.gameName='';
    $scope.games =[];
    $scope.game={};
    $scope.coverMessage='';
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
    $scope.wait=false;
    $scope.loaderMsg='...';
    $scope.gameStarted=false;
    $scope.gameTimes = {
        availableTimes: [
            {id: '120', name: '120 seconds'},
            {id: '90', name: '90 seconds'},
            {id: '60', name: '60 seconds'},
            {id: '30', name: '30 seconds'},
        ],
    };
    const interval = 10000;
    //get current games if any...
    refreshGameList();
    let loadGamesTimer = setInterval(() => {
        refreshGameList();
    }, interval);
    // let loadPlayerTimer = setInterval(function () {
    //     if(!$('#gameContainer').is(':visible'))
    //         refreshPlayerList();
    // }, interval); 
    function refreshGameList(){
        $http.get('/api/game')
        .then(function (result) {
            if(result.status==200){
                $scope.games=[];
                $scope.games = result.data.game;
            }
            else
                $scope.games = [];
        },
        function(error){
            alert(error.statusText);
            $scope.wait = false;
        });
    }
    
    function refreshPlayerList(){
        $('.js-playerLoad').show();
        let gameId=$('#hidGameId').val();
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
                    joinedAt:Date.now()
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
                $('#hidPlayerId').val(`${playerid}~c`); //to indicate the creator
                $('#hidGameId').val(gameid);
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
                    display:'block'
                  };
                $('#cover').css(styles);
                $scope.coverMessage='The game is not started yet, you need atleast 2 players to start the game. It is good to have 3 or more.';
                $('#mainContainer').fadeIn(1000);
                $('#gameContainer').fadeOut(1000);
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
       if(totalGamePlayers<100){
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
            $('#hidPlayerId').val(playerId);
            $('#hidGameId').val(gameId);
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
            data.gamePlayers.forEach(player => {
                if($scope.players.indexOf(player)<0){
                    p=player.playerName;
                }
                let a = player.pointsForGame.reduce((a, b) => a + b, 0)
                player.pointsForGame = a==0?'':a;
                player.playerAvatar = `images/avatars/${player.playerAvatar}`;
                player.playerTyping='';
                player.me = $('#hidPlayerId').val().split('~')[0] == player.playerId?true:false
            });
            $scope.players=data.gamePlayers;
            $scope.gameStarted = data.gameStarted;
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
                display:'block'
            };
            
            let x='admin';
            data.gamePlayers.forEach(player=>{
                if(player.isCreator)
                    x=player.playerName;
            })
            if(!$scope.gameStarted){
                $('#cover').css(styles);
                $scope.coverMessage=`The game is not started yet, waiting for ${x} to start the game`;
            }
            else{
                if($('#hidPlayerId').val().split('~')[0] == data.playerId){
                    $('#cover').css(styles);
                    $scope.coverMessage=`You have missed ${26-data.gameAlphabetArray.length} ${26-data.gameAlphabetArray.length>1?'alphabets':'alphabet'}, please wait until a new play begins`;
                }
            }
            $('#mainContainer').fadeIn(1000);
            $('#gameContainer').fadeOut(500);
              
            $scope.wait=false;
            $('#divStatus').text(`${p} has joined`).fadeIn('slow').fadeOut(5000);
        }
    });

    /*----- chat ----*/
    $scope.message = function(){
        if($('#txtMsg').val().length>0){
            var obj ={playerId:$('#hidPlayerId').val(),gameId:$('#hidGameId').val(),message:$('#txtMsg').val()};
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
        if($('#hidPlayerId').val().indexOf('~')>-1)
            socket.emit('playStarted', `${$('#hidGameId').val()}`);
    }
    socket.on('onPlayStarted',function(data){
        if(data.err!=''){
            console.log('game start err');
            alert('Some error occured while starting the game\n please try again');
        }
        else{
            //change icon
            if($('#hidGameId').val() == data.gameId){ //not needed to check
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
        gameId:$('#hidGameId').val(),
        playerId:$('#hidPlayerId').val().split('~')[0],
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
          gameId:$('#hidGameId').val(),
          playerId:$('#hidPlayerId').val(),
          words:wordsArray,
          pointsForGame:Number($scope.playingGame.namePoints) + Number($scope.playingGame.placePoints)+ Number($scope.playingGame.animalPoints) + Number($scope.playingGame.thingPoints)
        }
        socket.emit('submit', submitObj);
    }
    socket.on('onSubmit',function(data){
        $scope.coverMessage='';
        if(data.err!=''){
            console.log('game submit err');
            alert(`Some error occured while submitting\n please try again :${data.err}`);
        }
        else{
            let c=0;
            $.each($scope.players,function(i,v){
                if(v.playerId == data.playerId){
                    v.playerTyping = 'S';
                    v.pointsForGame = data.pointsForGame==0?'':data.pointsForGame;
                }
                if(v.playerTyping=='S')
                c++;
            });
            if($('#hidPlayerId').val().split('~')[0]==data.playerId){
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
                    display:'block'
                };
                $('#cover').css(styles);
                if($scope.players.length==c){
                    //everyone has submitted so 
                    if(data.gameAlphabetArray.length<26){
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
                                socket.emit('endPlay', data.gameId);  
                            //}    
                        }, 3300);
                    }
                    //$scope.wait=false;
                }
                else{
                    $scope.coverMessage='Waiting for everyone to submit';
                }
            }
            if($('#cover').css('display')=='block'){
                if($scope.players.length==c){
                    //everyone has submitted so 
                    $scope.coverMessage='Everyone submitted';
                // $scope.wait=true;
                   // setTimeout(function() {
                        if(data.gameAlphabetArray.length<26){
                            $scope.coverMessage='Everyone submitted, starting new play...';
                            //socket.emit('newPlay', data.gameId);  
                        }
                        else
                        $scope.coverMessage='Everyone submitted, game over... Wait for the leaderboard...';
                        //$scope.wait=false;
                    //}, 1300);
                }
                else{
                    $scope.coverMessage='Waiting for everyone to submit';
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
          if($('#hidGameId').val() == data.gameId){
            $scope.playingGame.name='',
            $scope.playingGame.place='',
            $scope.playingGame.animal='',
            $scope.playingGame.thing='',
            $scope.playingGame.namePoints=0,
            $scope.playingGame.placePoints=0,
            $scope.playingGame.animalPoints=0,
            $scope.playingGame.thingPoints=0,
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
    socket.on('onLeave',function(data){
        if(data.err!=''){
            console.log('game leave err');
            //alert(`Some error occured while leavi the game\n please try again :${data.err}`);
        }
        else{
            let p='';
            $scope.gamePlayers.forEach((player,i)=>{
                if(player.playerId == data.playerId){
                    p = player.playerName;
                    $scope.gamePlayers.splice(i,1);
                }
            });
            $('#divStatus').text(`${p} has left`).fadeIn('slow').fadeOut(5000);
        }
    })

    /**------ng-classes---------------------*/
    $scope.gameStartedIndicatorClass = function(){
        if($('#hidPlayerId').val().split('~')[1]=='c'){
            if($scope.players.length>=2)
                return 'fa fa-play fa-lg btn btn-default';
            else
                return $scope.game.gameStarted?'fa fa-play fa-lg':'fa fa-clock-o fa-spin';
        }
        else{
            return $scope.game.gameStarted?'fa fa-play fa-lg':'fa fa-clock-o fa-spin';
        }
    }
    $scope.typingClass = function(v){
        switch (v) {
            case 'N':
                return 'fa fa-commenting-o blinker orange';
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
        socket.emit('typing', `${$('#hidGameId').val()}~${$('#hidPlayerId').val().split('~')[0]}~N`);
        let s='';
        if($scope.playingGame.name) {
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
        socket.emit('typing', `${$('#hidGameId').val()}~${$('#hidPlayerId').val().split('~')[0]}~P`);
        let s='';
        if($scope.playingGame.place) {
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
        socket.emit('typing', `${$('#hidGameId').val()}~${$('#hidPlayerId').val().split('~')[0]}~A`);
        let s='';
        if($scope.playingGame.animal) {
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
        socket.emit('typing', `${$('#hidGameId').val()}~${$('#hidPlayerId').val().split('~')[0]}~T`);
        let s='';
        if($scope.playingGame.thing) {
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
        socket.emit('leave',{gameId:$('#hidGameId').val(),playerId:$('#hidPlayrId').val().split('~')[0]});
    });
});