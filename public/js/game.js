var mainmodule = angular.module("app-npat",[])

mainmodule.controller("game", ['$scope', '$http', function ($scope, $http) {
    $scope.wait = true;
    $scope.games =["test1","test2","test3","test4","test5","test6","test7","test8","test9","test10","test11","test12"];
    //if no game is going on then show covering div
    let w= $(window).width();
    $scope.game = '';`game list${w}`;
    if(w>412){
        $('#logoDiv').css({left:200});
        $scope.game = `game list${w}`;
    }
    else{
        $('#logoDiv').css({top:-63});
        $scope.game = `games${w}`;
    }
    let pos = $('#mainContainer').position();
    $('#gameContainer').css({top: pos.top, left:0});

    $scope.createGame = function(){
        //create a new game
        let gameid = `GAM-${$scope.gameName.substring(0, 3)}-${uuidv4().toString().substring(1, 4)}-${Date.now()}-${uuidv4().toString().substring(1, 4)}`;
        let playerid = `PLA-${$scope.gameName.substring(0, 3)}-${uuidv4().toString().substring(1, 4)}-${Date.now()}-${uuidv4().toString().substring(1, 4)}`;
        let game = {
            gameId:gameid,
            gameName:$scope.gameName,
            gameTime:$scope.gameTime?$scope.gameTime:0,
            gamePlayers:[
                {
                    playerId:playerid,
                    playerName:$scope.playerName,
                    playerAvatar:'1.png',
                    isCreator:true
                }
            ]
        }
        console.log(game);
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
}]);