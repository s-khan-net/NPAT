var mainmodule = angular.module("app-npat",[])

mainmodule.controller("game", ['$scope', '$http', function ($scope, $http) {
    $scope.wait = true;
    $scope.nameVal=false;
    $scope.placeVal=false;
    $scope.animalVal=false;
    $scope.thingVal=false;
    $scope.alphabet = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 1).toUpperCase();
    $scope.players =[];
    $scope.games =[];
    //if no game is going on then show covering div
    $scope.game = `games`;

    //get current games if any...
    $http.get('/api/game')
        .then(function (result) {
            $scope.games = result.data;
        },
        function(error){
            alert(error.statusText);
            $scope.wait = false;
        });
    $scope.gameStartedClass = function(v){
        return v?'green':'red';
    }
    $scope.createGame = function(){
        //create a new game
        let gameid = `GAM-${$scope.gameName.substring(0, 3)}-${uuidv4()}-${Date.now()}-${uuidv4()}`;
        let playerid = `PLA-${$scope.gameName.substring(0, 3)}-${uuidv4()}-${Date.now()}-${uuidv4()}`;
        let game = {
            gameId:gameid,
            gameName:$scope.gameName,
            gameTime:$scope.gameTime?$scope.gameTime:0,
            gameActive:true,
            gameStarted:false,
            gameStartedAt:Date.now(),
            gameEnded:false,
            gameEndedAt:Date.now(),
            gameAbandoned:false,
            gameSuspended:false,
            gameAlphabet:'',
            gameAlphabetArray:[],
            gamePlayers:[
                {
                    playerId:playerid,
                    playerName:$scope.playerName,
                    playerAvatar:'1.png',
                    isCreator:true,
                    pointsForGame:[],
                    joinedAt:Date.now()
                }
            ]
        }
        //save to DB
        //call api to save
        $scope.wait=true;
        $http.post('/api/game',JSON.stringify(game))
        .then(function (result) {
            //game saved
            $('#hidGameId').val(gameid);
            $('#gameContainer').fadeOut('slow');
        },
        function(error){
            alert(error.statusText);
            $scope.wait = false;
        });
        
    }
    $scope.joinGame = function(gameId){
        console.log(gameId);
    }
    /*----validate name-----*/
    $scope.ValName = function(v){
        let s='';
        if($scope.game.name) {
            s = $scope.game.name.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.game.name = '';
                $('.js-alphabet').css('color','red');
                $('.js-alphabet').addClass('vibrate');
                setTimeout(()=>{
                    $('.js-alphabet').removeAttr('style');
                    $('.js-alphabet').removeClass('vibrate');
                },540);
            }
            else{
                //validate name
                if($scope.game.name.length>=4){
                    let vc = vowel_count($scope.game.name);
                    if(vc>0 && vc<$scope.game.name.length ){
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
        if($scope.game.place) {
            s = v.game.place.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.game.place = '';
                $('.js-alphabet').css('color','red');
                $('.js-alphabet').addClass('vibrate');
                setTimeout(()=>{
                    $('.js-alphabet').removeAttr('style');
                    $('.js-alphabet').removeClass('vibrate');
                },540);
            }
            else{
                //validate place
                if($scope.game.place.length>=3){
                    let vc = vowel_count($scope.game.place);
                    if(vc>0 && vc<$scope.game.place.length ){
                        //call api to check
                        $scope.wait=true;
                        $http.get('api/words/place/'+$scope.game.place)
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
        if($scope.game.animal) {
            s = $scope.game.animal.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.game.animal = '';
                $('.js-alphabet').css('color','red');
                $('.js-alphabet').addClass('vibrate');
                setTimeout(()=>{
                    $('.js-alphabet').removeAttr('style');
                    $('.js-alphabet').removeClass('vibrate');
                },540);
            }
            else{
                //validate animal
                if($scope.game.animal.length>=3){
                    let vc = vowel_count($scope.game.animal);
                    if(vc>0 && vc<$scope.game.animal.length ){
                        //call api to check
                        $scope.wait=true;
                        $http.get('api/words/animal/'+$scope.game.animal)
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
        if($scope.game.thing) {
            s = $scope.game.thing.substring(0,1).toUpperCase();
            if( s !=$scope.alphabet){
                $scope.game.thing = '';
                $('.js-alphabet').css('color','red');
                $('.js-alphabet').addClass('vibrate');
                setTimeout(()=>{
                    $('.js-alphabet').removeAttr('style');
                    $('.js-alphabet').removeClass('vibrate');
                },540);
            }
            else{
                //validate animal
                if($scope.game.thing.length>=3){
                    let vc = vowel_count($scope.game.thing);
                    if(vc>0 && vc<$scope.game.thing.length ){
                        //call api to check
                        $scope.wait=true;
                        $http.get('api/words/thing/'+$scope.game.thing)
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
}]);