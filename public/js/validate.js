function initialize(){
    // $(document).keyup(function(e) { doesnt work on my phone.....
    //     if (e.which == 27) {
    //         if($('#chatcontainer').css('position')=='absolute'){
    //             $('#chatcontainer').css({zIndex:1,position:'static',display:'none',left:'auto'});
    //             $('.close').hide();
    //             $('#chatSection').hide();
    //             $('#chatsectionhead').hide();
    //         }
    //     }
    // });
    let w= $(window).width();
    $('#playersContainer').slimScroll({
        height: '100%', 
        position: 'left',
    });
    $('.gamesScroller').slimScroll({
        height: ($('#gameContainer').height() - 100)+'px'
    });
    $('#chatbox').slimScroll();
    $('#allgames').slimScroll();
    $('#btnChat').refreshbtn({
        width: 32,
        height: 32
    });    
    if(w>1000){
        $('#logoDiv > img').prop('src','/images/logo_145X145_t.png');
        $('.js-PlayerName').show();
        $('.js-PlayerStatus').show();
        $('#btnPlayer > img').css('width','50px');
        $('.nameForSmall').hide();
        $('#chatSection').show();
        $('#chatsectionhead').show();
        $('.close').hide();
        $('#btnChat #btnChat').hide();
        $('.js-PlayerPic').css('margin-left','-7px');
        $('.wa').hide();
        $('.js-share').show();
    }
    else{
        $('#logoDiv > img').prop('src','/images/logo_75X75_t.png');
        $('.js-PlayerName').hide();
        $('.js-PlayerStatus').hide();
        $('#btnPlayer > img').css('width','41px');
        $('.nameForSmall').show();
        $('#chatSection').hide();
        if(!$('#gameContainer').is(':visible'))
            $('#btnChat #btnChat').show();
        $('.js-PlayerPic').css('margin-left','7px');
        $('.wa').show();
        $('.js-share').hide();
    }
    if(w<=360){
        $('label').css({letterSpacing:'1px',fontSize:'inherit',lineHeight:1.7,paddingLeft:'7px'});
        $('.nameC').text('N');
        $('.placeC').text('P');
        $('.animalC').text('A');
        $('.thingC').text('T');
    }
    else{
        $('label').css({letterSpacing:'3px',fontSize:'inherit',lineHeight:1.7});
        $('.nameC').text('Name');
        $('.placeC').text('Place');
        $('.animalC').text('Animal');
        $('.thingC').text('Thing');
    }
    $( window ).resize(function() { //repeat telecast.... bad
        let w= $(window).width();
        if(w>1000){
            $('#logoDiv > img').prop('src','/images/logo_145X145_t.png');
            $('.js-PlayerName').show();
            $('.js-PlayerStatus').show();
            $('#btnPlayer > img').css('width','50px');
            $('.nameForSmall').hide();
            $('#chatSection').show();
            $('#chatsectionhead').show();
            $('#chatcontainer').css({display:'block',left:'auto',top:'42px'});
            $('.close').hide();
            $('#btnChat #btnChat').hide();
            $('.js-PlayerPic').css('margin-left','-7px');
        }
        else{
            $('#logoDiv > img').prop('src','/images/logo_75X75_t.png');
            $('.js-PlayerName').hide();
            $('.js-PlayerStatus').hide();
            $('#btnPlayer > img').css('width','41px');
            $('.nameForSmall').show();
            //$('#chatSection').hide();
            if(!$('#gameContainer').is(':visible'))
                $('#btnChat #btnChat').show();
            $('.js-PlayerPic').css('margin-left','7px');
        }
        if(w<=360){
            $('label').css({letterSpacing:'1px'});//,fontSize:'inherit',lineHeight:1.7,paddingLeft:'7px'});
            $('.nameC').text('N');
            $('.placeC').text('P');
            $('.animalC').text('A');
            $('.thingC').text('T');
        }
        else{
            $('label').css({letterSpacing:'3px'});//,fontSize:'inherit',lineHeight:1.7});
            $('.nameC').text('Name');
            $('.placeC').text('Place');
            $('.animalC').text('Animal');
            $('.thingC').text('Thing');
        }
    });
    
    //disable back
    history.pushState(null, null, document.URL);
        window.addEventListener('popstate', function () {
        history.pushState(null, null, document.URL);
    });
    
    $('.box').focus(function()
    {
        $(this).animate({ height: '+=3' }, 'slow');
    }).blur(function()
    {
        $(this).animate({ height: '-=3' }, 'slow');
    });

    var pics=35;
    $('.js-playerStuff').show();
    $('.js-gameStuff').hide();
    var items = ['Truman', 'Sloth', 'toothless', 'sullivan', 'aceVentura', 'BruceAlmighty','Astrid','JackTheReaper','Elsa','MikeLebowsky','JamesDean','Hiccup','Ralph','Monoke','Shrek','Alcázar','sharkBait','Rastapopulous','Aviator', 'Parkins', 'Randall', 'Farquaad', 'BruceAlmighty','Astrid','JackTheReaper','Elsa','MikeLebowsky','JamesDean','Hiccup','Ralph','Monoke','Shrek','Alcázar','sharkBait','Rastapopulous'];
    var i = Math.floor(Math.random() * pics) + 1;
    $('#txtPlayerName').attr('placeholder',items[i]);
    $('#avatarContainer > img').prop('src','images/avatars/'+i+'.png');

    $('#txtPlayerName').on('keyup',function(){
        if($('#txtPlayerName').val().length>3){
            $('#txtPlayerName').attr('style','border:none');
            // $('#btnPlayerOn').removeAttr('disabled');
            // $('#btnPlayerOnJoin').removeAttr('disabled');
        }
        else{
            $('#txtPlayerName').attr('style','border:1px solid red');
            // $('#btnPlayerOn').attr('disabled','disabled');
            // $('#btnPlayerOnJoin').attr('disabled','disabled');
        }
    });
    $('#btnPlayerOn').click(function(){
        if($('#txtPlayerName').val().length>3){
            $('.js-playerStuff').hide();
            $('#js-gameContainer').removeClass().addClass('col-xs-9').addClass('col-md-6');
            $('#gamesList').fadeIn('slow');
            //$('#gameTime').val(60); doesnt set the scope var!!:(
            $('.js-gameStuff').show();
            $('#avatarContainer2 > img').prop('src',$('#avatarContainer > img').prop('src'));
            $('#hidPlayerAv').val(new URL($('#avatarContainer > img').prop('src')).pathname.split('/')[3]);
        }
        else{

        }
    });
    $('#txtGameName').on('keyup',function(){
        if($('#txtGameName').val().length>3  && $('#gameTime').find(":selected").text()!='Select time'){
            $('#btnGameOn').removeAttr('disabled');
        }
        else{
            $('#btnGameOn').attr('disabled','disabled');
        }
    });
    $('#gameTime').on('change',function(){
        if($('#txtGameName').val().length>3  && $('#gameTime').find(":selected").text()!='Select time'){
            $('#btnGameOn').removeAttr('disabled');
        }
        else{
            $('#btnGameOn').attr('disabled','disabled');
        }
    });
    $('.js-avRight').click(function(){
        var v = Number(new URL($('#avatarContainer > img').prop('src')).pathname.split('/')[3].split('.')[0]);
        v = v==pics?1:v+1;
        $('#avatarContainer > img').prop('src',`/images/avatars/${v}.png`);
        $('#txtPlayerName').attr('placeholder',items[v]);
    });
    $('.js-avLeft').click(function(){
        var v = Number(new URL($('#avatarContainer > img').prop('src')).pathname.split('/')[3].split('.')[0]);
        v = v==1?pics:v-1;
        $('#avatarContainer > img').prop('src',`/images/avatars/${v}.png`);
        $('#txtPlayerName').attr('placeholder',items[v]);
    });
    $('#logoDiv').on('mouseover mouseout',function(){
        $('#logoDiv i').toggle();
    });
    $('#modalAvatars').on('shown.bs.modal', function() {
        var html = '<div class="row">';
        for (let i = 1; i <= pics; i++) {
            html +=`<div class="col-md-2 col-xs-4" id="selectAvatar" onclick="$('#avatarContainer > img').prop('src','/images/avatars/${i}.png');$('#modalAvatars').modal('hide');" style="text-align:center;margin-bottom:2px;cursor:pointer"><img style="border: 3px solid silver;border-radius: 4px;"src="/images/avatars/${i}.png" /></div>`;
        }
        html +='</div>';
        $('#modalAvatarsBody').html(html);
    });
    $('#cover').click(function(){
        if($('#cover').html().indexOf('pts.,')>-1){
            $('#pointsModal').modal({
                backdrop: "static",
                keyboard:true
            });
        }
    });
    $('#pointsModal').on('shown.bs.modal', function() {
        var $scope = angular.element($('[data-ng-controller="game"]')).scope();
        let gid = $scope.currentGameId;
        // let url = new URL(window.location.href);
        // let u=url.host+'/api/game/'+gid;
        let html='loading...';
        $.ajax({
            url: '/api/game/'+gid,
            type: 'GET',
            dataType: 'jsonP',
            success: function(data) {
                
            },
            complete:function(data){
                if(data.game){
                    let players=[];
                    
                    $.each(data.game.gamePlayers,function(o,p){
                        p.pointsForGame = p.pointsForGame.reduce((a, b) => a + b, 0)
                    });
                    players.sort(function(a,b) {return a.pointsForGame - b.pointsForGame}).reverse();

                    html = '<div class="container">';
                    $.each(players,function(i,v){
                        html += `<div class="row">`;
                        html += `<div class="col-xs-12 text-left">`;
                        html += `<b>${v.playerName}:</b>`;
                        if(i==0){
                            html +='&nbsp;<span class="fa-stack"><i class="fa fa-trophy fa-stack-2x"></i><i class="fa fa-star fa-stack-1x" style="line-height: 20px;color: gold;padding-left: 6px;"></i></span>';
                        }
                        html += '</div>';
                        html += '</div>';
                        $.each(v.wordsForGame,function(j,w){
                            let starta =  w.name || w.place || w.animal || w.thing;
                            html += '<div class="row">';
                            html += '<div class="col-xs-12">';
                            if((`-${w.namePoints}-${w.placePoints}-${w.animalPoints}-${w.thingPoints}-`).indexOf('-0-')==-1){
                                let b = w.namePoints + w.placePoints + w.animalPoints + w.thingPoints;
                                html += `<b>${starta.substr(0,1)}</b>: (<small>pts.</small>-${b} + <small>Bonus</small>-${w.bonusPoints}) = ${b+w.bonusPoints} , submitted on-<b><i>${w.playTime}</b></i> second <select><option>N-${w.name }</option><option>P-${w.place}</option><option>A-${w.animal}</option><option>T-${w.thing}</option></select>`;
                            }
                            else{
                                if(starta){
                                    html += `${starta.substr(0,1)}: (<small>pts.</small>-${w.namePoints + w.placePoints + w.animalPoints + w.thingPoints}), submitted on-<b><i>${w.playTime}</i></b> second <select><option>N-${w.name }</option><option>P-${w.place}</option><option>A-${w.animal}</option><option>T-${w.thing}</option></select>`;
                                }
                                else{
                                    html += ` - : (<small>pts.</small>-0), submitted on-<b><i>${w.playTime}</i></b> second`;
                                }
                            }
                            html += '</div>';
                            html += '</div>';
                        });
                    });
                    html += '</div>';
                    $('#pointsModalBody').html(html);
                }
            },
            error: function(xhr, status, error) {
                var data = JSON.parse(xhr.responseText);
                if(data.game){
                    $.each(data.game.gamePlayers,function(o,p){
                        p.pointsForGame = p.pointsForGame.reduce((a, b) => a + b, 0)
                    });
                    data.game.gamePlayers.sort(function(a,b) {return a.pointsForGame - b.pointsForGame}).reverse();

                    html = '<div class="container">';
                    $.each(data.game.gamePlayers,function(i,v){
                        html += `<div class="row">`;
                        html += `<div class="col-xs-12 text-left">`;
                        html += `<b>${v.playerName}:</b>`;
                        if(i==0){
                            html +='&nbsp;<span class="fa-stack"><i class="fa fa-trophy fa-stack-2x"></i><i class="fa fa-star fa-stack-1x" style="line-height: 20px;color: gold;padding-left: 6px;"></i></span>';
                        }
                        html += '</div>';
                        html += '</div>';
                        $.each(v.wordsForGame,function(j,w){
                            let starta =  w.name || w.place || w.animal || w.thing;
                            html += '<div class="row">';
                            html += '<div class="col-xs-12">';
                            if((`-${w.namePoints}-${w.placePoints}-${w.animalPoints}-${w.thingPoints}-`).indexOf('-0-')==-1){
                                let b = w.namePoints + w.placePoints + w.animalPoints + w.thingPoints;
                                html += `<b>${starta.substr(0,1)}</b>: (<small>pts.</small>-${b} + <small>Bonus</small>-${w.bonusPoints}) = ${b+w.bonusPoints} , submitted on-<b><i>${w.playTime}</b></i> second <select><option>N-${w.name }</option><option>P-${w.place}</option><option>A-${w.animal}</option><option>T-${w.thing}</option></select>`;
                            }
                            else{
                                if(starta){
                                    html += `${starta.substr(0,1)}: (<small>pts.</small>-${w.namePoints + w.placePoints + w.animalPoints + w.thingPoints}), submitted on-<b><i>${w.playTime}</i></b> second <select><option>N-${w.name }</option><option>P-${w.place}</option><option>A-${w.animal}</option><option>T-${w.thing}</option></select>`;
                                }
                                else{
                                    html += ` - : (<small>pts.</small>-0), submitted on-<b><i>${w.playTime}</i></b> second`;
                                }
                            }
                            html += '</div>';
                            html += '</div>';
                        });
                    });
                    html += '</div>';
                    $('#pointsModalBody').html(html);
                }
            }
        });
    });
    $("#pointsModal").on('hidden.bs.modal', function () {
        $('#pointsModalBody').html('');
    });

    $('#avatarContainer').click(function(){
        $("#modalAvatars").modal({
            backdrop: "static",
            keyboard:true
        });
    });
    $('#showHelp').click(function(){
        $("#modalHelp").modal({
            backdrop: "static",
            keyboard:true
        });
    });
    $('#showAbout').click(function(){
        $("#modalAbout").modal({
            backdrop: "static",
            keyboard:true
        });
    });
    $('#logoDiv').click(function(){
        $("#modalHelp").modal({
            backdrop: "static",
            keyboard:true
        });
    });
    $('#btnChooseAlphabets').click(function(){
        $('#alphabetsModal').modal({
            backdrop: "static",
            keyboard:true
        });
    });
    $('#alphabetsModal').on('shown.bs.modal', function(){
        var $scope = angular.element($('[data-ng-controller="game"]')).scope();
        let a = $scope.gameAlphabets;
        $('#alphabetsModalTitle').text(`Choose ${a} alphabets`);
        rArray = [];
        for(var i=1;i<=a;i++){
            var r = Math.floor(Math.random() *26) + 1;
            if(rArray.indexOf(r)>-1){
                i--;
            }
            else{
                rArray.push(r);
            }
        }
        $('#hidrArray').val(rArray);
        $.each(rArray,function(i,v){
            $('#alpha-'+v).addClass('btn-info');
        });
        // var alphabets=['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
        // var html='<div class="row">'
        // for(var i=1;i<=26;i++){
        //     if(rArray.indexOf(i)>-1)
        //     html +='<div class="col-xs-2 text-center"><span id="alpha-'+i+'" class="alpha btn-info" >'+alphabets[i-1]+'</span></div>';
        //     else
        //         html +='<div class="col-xs-2 text-center"><span id="alpha-'+i+'" class="alpha" >'+alphabets[i-1]+'</span></div>';
        // }
        // html +='</div>';
        // $('#alphabetsModalBody').html(html);
    });
    $('#alphabetsModal').on('hidden.bs.modal', function(){
        for(var i=1;i<=26;i++){
            $('#alpha-'+i).removeClass('btn-info');
        }
    });
    $("span[id^='alpha']").on('click',function(){
        id = this.id.split('-')[1];
        rArray = $('#hidrArray').val().split(',');
        if(rArray.indexOf(id)==-1){
            var r = Math.floor(Math.random() *rArray.length);
            var removed = rArray[r];
            rArray[r]=id;
            $( '#alpha-'+removed ).removeClass('btn-info');
            $( '#alpha-'+id ).addClass('btn-info');
            $('#hidrArray').val(rArray);
        }
    });
}

// function playerDetails(p){
//     let id = $(p.children[0]).html()
//     let admin = $(p.children[1]).html()
//     console.log(`player ${id} -> ${admin}`);
//     var position = $(p).position();
//     console.log(position.top + ' ' + position.left );
//     $('.playerDetailsDiv').attr('style', 'top:' + p.pageY + 'px;left:' +p.pageX + 'px;display:block;');
// }