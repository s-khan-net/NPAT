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
    $('#box').focus(function()
    {
        $(this).animate({ width: '+=50' }, 'slow');
    }).blur(function()
    {
        $(this).animate({ width: '-=50' }, 'slow');
    });
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
        $('#txtGameName').on('keyup',function(){
            if($('#txtGameName').val().length>3){
                $('#btnGameOn').removeAttr('disabled');
            }
            else{
                $('#btnGameOn').attr('disabled','disabled');
            }
        });
        $('#btnPlayerOn').click(function(){
            $('.js-playerStuff').hide();
            $('.js-gameStuff').show();
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