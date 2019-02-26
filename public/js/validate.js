function initialize(){
    let w= $(window).width();
    $('#playersContainer').slimScroll({
        height: '100%', 
        position: 'left',
    });
    $('.gamesScroller').slimScroll({
    });
    $('#chatbox').slimScroll();
    $('#allgames').slimScroll();
    $('#btnChat').refreshbtn({
        width: 32,
        height: 32
    });
    // var times= [
    //     {id: '120', name: '120 seconds'},
    //     {id: '90', name: '90 seconds'},
    //     {id: '60', name: '60 seconds'},
    //     {id: '30', name: '30 seconds'},
    // ];
    // $.each(times,function(i,v){
    //     $('#gameTime').append(new Option(v.name,v.id));
    // });
    
    if(w>1000){
        //$('#gameContainer').css({left:'99px',width:'86%'});
        //$('#chatbox').height($('#cover').height() - $('#txtMsg').height());
        $('#logoDiv > img').prop('src','/images/logo_150X150.png');
        $('.js-PlayerName').show();
        $('.js-PlayerStatus').show();
        $('#nameForSmall').hide();
        $('#chatSection').show();
        $('#chatsectionhead').show();
        $('#btnChat #btnChat').hide();
        $('.js-PlayerPic').css('margin-left','-7px');
    }
    else{
        //$('#gameContainer').css({left:'0px',width:'100%'});
        //$('#chatbox').height($('#cover').height() - $('#txtMsg').height());
        $('#logoDiv > img').prop('src','/images/logo_75X75.png');
        $('.js-PlayerName').hide();
        $('.js-PlayerStatus').hide();
        $('#nameForSmall').show();
        $('#chatSection').hide();
        $('#btnChat #btnChat').show();
        $('.js-PlayerPic').css('margin-left','7px');
    }
    $( window ).resize(function() { //repeat telecast.... bad
        let w= $(window).width();
        if(w>1000){
            //$('#gameContainer').css({left:'99px',width:'86%'});
            //$('#chatbox').height($('#cover').height() - $('#txtMsg').height());
            $('#logoDiv > img').prop('src','/images/logo_150X150.png');
            $('.js-PlayerName').show();
            $('.js-PlayerStatus').show();
            $('.nameForSmall').hide();
            $('#chatSection').show();
            $('#chatsectionhead').show();
            $('#btnChat #btnChat').hide();
            $('.js-PlayerPic').css('margin-left','-7px');
        }
        else{
            //$('#gameContainer').css({left:'0px',width:'100%'});
            //$('#chatbox').height($('#cover').height() - $('#txtMsg').height());
            $('#logoDiv > img').prop('src','/images/logo_75X75.png');
            $('.js-PlayerName').hide();
            $('.js-PlayerStatus').hide();
            $('.nameForSmall').show();
            $('#chatSection').hide();
            $('#btnChat #btnChat').show();
            $('.js-PlayerPic').css('margin-left','7px');
        }
        // var styles = {
        //     zIndex:2,
        //     background:"rgb(225,255,255)",
        //     background:"-moz-linear-gradient(top, rgba(225,255,255,1) 0%, rgba(225,255,255,1) 7%, rgba(225,255,255,1) 12%, rgba(253,255,255,1) 12%, rgba(230,248,253,1) 30%, rgba(200,238,251,1) 54%, rgba(190,228,248,1) 75%, rgba(177,216,245,1) 100%)",
        //     background:"-webkit-linear-gradient(top, rgba(225,255,255,1) 0%,rgba(225,255,255,1) 7%,rgba(225,255,255,1) 12%,rgba(253,255,255,1) 12%,rgba(230,248,253,1) 30%,rgba(200,238,251,1) 54%,rgba(190,228,248,1) 75%,rgba(177,216,245,1) 100%)",
        //     background:"linear-gradient(to bottom, rgba(225,255,255,1) 0%,rgba(225,255,255,1) 7%,rgba(225,255,255,1) 12%,rgba(253,255,255,1) 12%,rgba(230,248,253,1) 30%,rgba(200,238,251,1) 54%,rgba(190,228,248,1) 75%,rgba(177,216,245,1) 100%)",
        //     filter:"progid:DXImageTransform.Microsoft.gradient( startColorstr='#e1ffff', endColorstr='#b1d8f5',GradientType=0 )",
        //     width:(Number($('#mainGameSection').css('width').split('p')[0])-20)+'px',
        //     opacity:0.7,
        //     height:(Number($('#mainGameSection').css('height').split('p')[0])-20)+'px',
        //     top:'43px',
        //     position:'absolute',
        //     paddingLeft:'57px',
        //     paddingTop: '90px',
        //     fontSize: 'large',
        //     paddingRight: '19px',
        //     color:'#00588b',
        //     display:'block'
        //   };
        // $('#cover').css(styles);
    });
    
    // let pos = $('#mainContainer').position();
    // $('#gameContainer').css({top: pos.top});
  
    //alert on refresh
    // window.onbeforeunload = function() {
    //     return "Dude, are you sure you want to leave?";
    // }
    // $( window ).unload(function() {
    //     alert("Bye now!");
    //   });
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
    function selectAvatar(v){
        $('#avatarContainer > img').prop('src',`/images/avatars/${v}.png`);
    }
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
        var pics=30;
        $('.js-playerStuff').show();
        $('.js-gameStuff').hide();
        var items = ['Truman', 'Sloth', 'toothless', 'sullivan', 'aceVentura', 'BruceAlmighty','Astrid','JackTheReaper','Elsa','MikeLebowsky','JamesDean','Hiccup','Ralph','Monoke','Shrek','Alcázar','sharkBait'];
        var item = jQuery.rand(items);
        $('#txtPlayerName').attr('placeholder',item);
        var i = Math.floor(Math.random() * pics) + 1;
        $('#avatarContainer > img').prop('src','images/avatars/'+i+'.png');

        $('#txtPlayerName').on('keyup',function(){
            if($('#txtPlayerName').val().length>3){
                $('#btnPlayerOn').removeAttr('disabled');
            }
            else{
                $('#btnPlayerOn').attr('disabled','disabled');
            }
        });
        $('#btnPlayerOn').click(function(){
            //$('#gameTime option[value="? number:0 ?"]').remove();
            $('.js-playerStuff').hide();
            $('#gamesList').show();
            $('.js-gameStuff').show();
            $('#avatarContainer2 > img').prop('src',$('#avatarContainer > img').prop('src'));
            $('#hidPlayerAv').val(new URL($('#avatarContainer > img').prop('src')).pathname.split('/')[3]);
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
        });
        $('.js-avLeft').click(function(){
            var v = Number(new URL($('#avatarContainer > img').prop('src')).pathname.split('/')[3].split('.')[0]);
            v = v==1?pics:v-1;
            $('#avatarContainer > img').prop('src',`/images/avatars/${v}.png`);
        });
        
        $('#modalAvatars').on('shown.bs.modal', function() {
            var html = '<div class="row">';
            for (let i = 1; i <= pics; i++) {
                html +=`<div class="col-md-2 col-xs-4" id="selectAvatar" onclick="$('#avatarContainer > img').prop('src','/images/avatars/${i}.png');$('#modalAvatars').modal('hide');" style="text-align:center;margin-bottom:2px;cursor:pointer"><img style="border: 3px solid silver;border-radius: 4px;"src="/images/avatars/${i}.png" /></div>`;
            }
            html +='</div>';
            $('#modalAvatarsBody').html(html);
        });

        $('#avatarContainer').click(function(){
            $("#modalAvatars").modal({
                backdrop: "static"
            });
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