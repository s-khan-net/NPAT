var mainmodule = angular.module("app-npat",[])

mainmodule.controller("game", ['$scope', '$http', function ($scope, $http) {
    $scope.wait = true;
    $scope.games =["test1","test2","test3","test4","test5","test6","test7","test8","test9","test10","test11","test12"];
    //if no game is going on then show covering div
    $scope.game = `games`;

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
            gameStatedAt:null,
            gameEnded:false,
            gameEndedAt:null,
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
        return Math.random().toString(36).split('.')[1].substr(0,4)
      }
}]);