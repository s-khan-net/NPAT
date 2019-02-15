function validate(type){
    // let u = '';
    // $.ajax({
    //     url: "assets/animals.txt",
    //     async: false,
    //     success: function (data){
    //         pageExecute.fileContents = data;
    //     }
    // });
}
function initialize(){
    let w= $(window).width();
    if(w>412){
        $('#gameContainer').css({left:'99px',width:'86%'});
        $('#chatbox').height($('#playersContainer').height() - $('#txtMsg').height());
        $('#chatSection').show();
    }
    else{
        $('#gameContainer').css({left:'0px',width:'100%'});
        $('#chatSection').hide();
    }
    $( window ).resize(function() { //repeat telecast.... bad
        let w= $(window).width();
        if(w>412){
            $('#logoDiv').css({left:200});
            $('#gameContainer').css({left:'99px',width:'86%'});
            $('#chatbox').height($('#playersContainer').height() - $('#txtMsg').height());
            $('#chatSection').show();
        }
        else{
            $('#logoDiv').css({top:-63});
            $('#gameContainer').css({left:'0px',width:'100%'});
            $('#chatSection').hide();
        }
        var styles = {
            zIndex:2,
            backgroundColor : "#ddd",
            width:(Number($('#mainGameSection').css('width').split('p')[0])-20)+'px',
            opacity:0.7,
            height:(Number($('#mainGameSection').css('height').split('p')[0])-20)+'px',
            top:'43px',
            position:'absolute',
            paddingLeft:'57px',
            paddingTop: '90px',
            fontSize: 'large',
            paddingRight: '19px',
            color:'darkred'
          };
        $('#cover').css(styles);
    });
    $('#playersContainer').slimScroll({
        height: '100%', 
        position: 'left',
    });
    $('#chatbox').slimScroll({
        height: '100%', 
    });
    let pos = $('#mainContainer').position();
    $('#gameContainer').css({top: pos.top});
    //alet on refresh
    window.onbeforeunload = function() {
        return "Dude, are you sure you want to leave? Think of the kittens!";
    }
    //disable back
    history.pushState(null, null, document.URL);
        window.addEventListener('popstate', function () {
        history.pushState(null, null, document.URL);
    });

    $('#box').focus(function()
    {
        $(this).animate({ width: '+=50' }, 'slow');
    }).blur(function()
    {
        $(this).animate({ width: '-=50' }, 'slow');
    });
    if(window.location.href.indexOf('Join')>-1){ 
        var url = new URL(window.location.href);
        var gid = url.searchParams.get("id");
        //var gid = url.split('?')[1].substr(0,url.length);
        //verifyGameId
        let u=url.host+'/api/game/'+gid;
        // $.get(u,function(data,status){
        //     if(data.game)
        //     $('#hidGameId').val(gid);
        // })
        $.ajax({
            url: '/api/game/'+gid,
            type: 'GET',
            async: true,
            crossDomain: true,
            dataType: 'jsonP', // added data type
            success: function(data) {
                if(data.game)
                    $('#hidGameId').val(gid);
            }
        });
    }
    if($('#hidGameId').val().length>3){
        $('#gameContainer').hide();
    }
    else{
        $('.js-playerStuff').show();
        $('.js-gameStuff').hide();
        var items = ['Truman', 'SidTheSloth', 'toothless', 'sullivan', 'aceVentura', 'BruceAlmighty','Astrid','JackTheReaper','Elsa','MikeLebowsky','JamesDean'];
        var item = jQuery.rand(items);
        $('#txtPlayerName').attr('placeholder',item);

        $('#txtPlayerName').on('keyup',function(){
            if($('#txtPlayerName').val().length>3){
                $('#btnPlayerOn').removeAttr('disabled');
            }
            else{
                $('#btnPlayerOn').attr('disabled','disabled');
            }
        });
        $('#btnPlayerOn').click(function(){
            $('.js-playerStuff').hide();
            $('#gamesList').show();
            $('.js-gameStuff').show();
            $('#avatarContainer2 > img').prop('src',$('#avatarContainer > img').prop('src'));
            $('#hidPlayerAv').val(new URL($('#avatarContainer > img').prop('src')).pathname.split('/')[3]);
        });
        $('#txtGameName').on('keyup',function(){
            if($('#txtGameName').val().length>3){
                $('#btnGameOn').removeAttr('disabled');
            }
            else{
                $('#btnGameOn').attr('disabled','disabled');
            }
        });
        $('.js-avRight').click(function(){
            var v = Number(new URL($('#avatarContainer > img').prop('src')).pathname.split('/')[3].split('.')[0]);
            v = v==12?1:v+1;
            $('#avatarContainer > img').prop('src',`/images/avatars/${v}.png`);
        });
        $('.js-avLeft').click(function(){
            var v = Number(new URL($('#avatarContainer > img').prop('src')).pathname.split('/')[3].split('.')[0]);
            v = v==1?12:v-1;
            $('#avatarContainer > img').prop('src',`/images/avatars/${v}.png`);
        });
    }
    
}

(function($) {
    $.rand = function(arg) {
        if ($.isArray(arg)) {
            return arg[$.rand(arg.length)];
        } else if (typeof arg === "number") {
            return Math.floor(Math.random() * arg);
        } else {
            return 4;  // chosen by fair dice roll
        }
    };
})(jQuery);