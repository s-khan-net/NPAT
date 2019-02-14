var mainmodule = angular.module("app-npat",['ngSanitize'])
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
    $scope.nameVal=false;
    $scope.placeVal=false;
    $scope.animalVal=false;
    $scope.thingVal=false;
    $scope.alphabet = '...'
    $scope.players =[];
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
    $scope.gameTime=180;
    $scope.wait=false;
    $scope.loaderMsg='loading...';
    $scope.gameStarted=false;
    //if no game is going on then show covering div
    
    const interval = 50000;
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
        return v?'green':'red';
    }
    $scope.createGame = function(){
        //create a new game
        let gameid = `G-${$scope.gameName.substring(0, 3)}-${uuidv4()}-${Date.now()}-${uuidv4()}`;
        let playerid = `P-${$scope.gameName.substring(0, 3)}-${$scope.playerName.substring(0, 3)}-${Date.now()}-${$('#hidPlayerAv').val().split('.')[0]}`;
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
        $scope.wait=true;
        $http.post('/api/game',JSON.stringify(game))
        .then(function (result) {
            if(result.status=='201'){
                //game saved
                //build player list
                $scope.players=[];
                $scope.players.push({playerId:game.gamePlayers[0].playerId,playerName:game.gamePlayers[0].playerName,pointsForGame:0,isCreator:true,playerAvatar:`images/avatars/${game.gamePlayers[0].playerAvatar}`});
                $('#hidPlayerId').val(`${playerid}~c`); //to indicate the creator
                $('#hidGameId').val(gameid);
                $scope.gameStarted = false;
                var styles = {
                    zIndex:2,
                    backgroundColor : "#ddd",
                    width:$('#mainGameSection').css('width'),
                    opacity:0.7,
                    height:$('#mainGameSection').css('height'),
                    top:'43px',
                    position:'absolute',
                    paddingLeft:'57px',
                    paddingTop: '90px',
                    fontSize: 'large',
                    paddingRight: '19px',
                    color:'darkred'
                  };
                $('#cover').css(styles);
                $scope.coverMessage='The game is not started yet,<br> You need atleast 2 players to start the game<br>It is good to have more than 3.';
                $('#gameContainer').fadeOut('fast',function(){
                    $scope.wait=false;
                });
            }
            else{
                alert('Sorry, couldnt create the game... ');
            }
        },
        function(error){
            alert(error.statusText);
            $scope.wait = false;
        });
        
    }
    $scope.joinGame = function(gameId,gameName){
        console.log(gameId);
        $scope.wait=true;
        $scope.loaderMsg='Joining game...'
        var playerid = `P-${gameName.substring(0, 3)}-${$scope.playerName.substring(0, 3)}-${Date.now()}-${$('#hidPlayerAv').val().split('.')[0]}`;
        var obj={
            gameId:gameId,
            playerId:playerid,
            playerName:$scope.playerName,
            playerAvatar:$('#hidPlayerAv').val()
        };
        socket.emit('joinGame', obj);
    }
    socket.on('joined',function(data) {
        let p='';
        data.gamePlayers.forEach(player => {
          if($scope.players.indexOf(player)<0){
            p=player.playerName;
          }
          player.pointsForGame = player.pointsForGame.reduce((a, b) => a + b, 0);
          player.playerAvatar = `images/avatars/${player.playerAvatar}`;
        });
        $scope.gameStarted = data.gameStarted;
        if(!$scope.gameStarted){
            var styles = {
                zIndex:2,
                backgroundColor : "#ddd",
                width:$('#mainGameSection').css('width'),
                opacity:0.7,
                height:$('#mainGameSection').css('height'),
                top:'43px',
                position:'absolute',
                paddingLeft:'57px',
                paddingTop: '90px',
                fontSize: 'large',
                paddingRight: '19px',
                color:'darkred'
              };
            $('#cover').css(styles);
            let p='admin';
            data.gamePlayers.forEach(player=>{
                if(player.isCreator)
                    p=player.playerName;
            })
            $scope.coverMessage=`The game is not started yet, <br> waiting for ${p} to start the game`;

        }
        $('#gameContainer').fadeOut('fast',function(){
            $scope.wait=false;
        });
        $('#divStatus').html(`${p} has joined`);
        $scope.players=data.gamePlayers;
      });

    $scope.gameStartedIndicatorClass = function(){
        if($('#hidPlayerId').val().split('~')[1]=='c'){
            return $scope.game.gameStarted?'fa fa-play fa-lg green ':'fa fa-play btn btn-success';
        }
        else{
            return $scope.game.gameStarted?'fa fa-play fa-lg green ':'fa fa-clock-o fa-spin';
        }
    }
    /*----validate name-----*/
    $scope.ValName = function(v){
        let s='';
        if($scope.playingGame.name) {
            s = $scope.playingGame.name.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.playingGame.name = '';
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
                    }
                    else{
                        $scope.nameVal = false;
                    }
                }
                else{
                    $scope.nameVal = false;
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
        let s='';
        if($scope.playingGame.place) {
            s = v.playingGame.place.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.playingGame.place = '';
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
                        $scope.wait=true;
                        $http.get('api/words/place/'+$scope.playingGame.place)
                        .then(function (result) {
                            $scope.wait = false;
                            if(result.data) $scope.placeVal = true;
                            else $scope.placeVal = false;
                        },
                        function(error){
                            alert(error.statusText);
                            $scope.wait = false;
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
            if($scope.wait==true) c='fa fa-spinner fa-spin grey';
            else if($scope.placeVal==true) c='fa fa-check-circle green';
            else if($scope.placeVal==false) c='fa fa-close red';
        }
        return c;
    }

    /*-----validate animal----*/
    $scope.ValAnimal = function(v){
        let s='';
        if($scope.playingGame.animal) {
            s = $scope.playingGame.animal.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.playingGame.animal = '';
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
                        $scope.wait=true;
                        $http.get('api/words/animal/'+$scope.playingGame.animal)
                        .then(function (result) {
                            $scope.wait = false;
                            if(result.data) $scope.animalVal = true;
                            else $scope.animalVal = false;
                        },
                        function(error){
                            alert(error.statusText);
                            $scope.wait = false;
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
            if($scope.wait==true) c='fa fa-spinner fa-spin grey';
            else if($scope.animalVal==true) c='fa fa-check-circle green';
            else if($scope.animalVal==false) c='fa fa-close red';
        }
        return c;
    }

    /*------validate thing-----*/
    $scope.ValThing = function(v){
        let s='';
        if($scope.playingGame.thing) {
            s = $scope.playingGame.thing.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.playingGame.thing = '';
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
                        $scope.wait=true;
                        $http.get('api/words/thing/'+$scope.playingGame.thing)
                        .then(function (result) {
                            $scope.wait = false;
                            if(result.data) $scope.thingVal = true;
                            else $scope.thingVal = false;
                        },
                        function(error){
                            alert(error.statusText);
                            $scope.wait = false;
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
            if($scope.wait==true) c='fa fa-spinner fa-spin grey';
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
});