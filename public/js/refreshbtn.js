(function ( $ ) {
    $.fn.refreshbtn = function (options) {
        var defaults = {
            width: 28,
            height: 28
        }
        options = $.extend(defaults, options);
        var w = options.width;
        var h = options.height;
        if (Number(window.innerWidth) < 768) {
            w = w - 8;
            h = h - 8;
        }
        $(this).html('<div id="btnChat" style="width:' + w + 'px;height:' + h + 'px;display:none;position:absolute;bottom:0px;color:#337ab7"><i class="fa fa-comments-o fa-2x "></i></div>');
        
        $('#btnChat').click(function () {
            //var t=($(window).height()/4.7)+'px';
            // if($('#chatcontainer').css('position')=='absolute'){
            //     $('#chatcontainer').css({zIndex:1,position:'static',display:'none',left:'auto'});
            //     $('.close').hide();
            //     $('#chatSection').hide();
            //     $('#chatsectionhead').hide();
            //     $('#chat').hide();
                
            // }
            // else{
                $('#chatcontainer').css({zIndex:6,position:'absolute',display:'block',left:'22%',top:'32px',maxWidth:'250px'});
                $('.close').show();
                $('#chatSection').show();
                $('#chat').show();
                $('#chatsectionhead').hide();
                $('#btnChat').hide();
                $("#chatbox").scrollTop(1E10);
           // }
        });
        $('.close').click(function(){
            $('#chatcontainer').css({zIndex:1,position:'static',display:'none',left:'auto'});
            $('.close').hide();
            $('#chat').hide();
            $('#chatSection').hide();
            $('#chatsectionhead').hide();
            $('#btnChat').show();
        });
        $('#chat').click(function(){
            $('#chatcontainer').css({zIndex:1,position:'static',display:'none',left:'auto'});
            $('#btnChat').show();
            $('.close').hide();
            $('#chat').hide();
            $('#chatSection').hide();
            $('#chatsectionhead').hide();
        });
    }
}(jQuery));
