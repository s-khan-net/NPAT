function validate(type){
    let u = '';
    $.ajax({
        url: "assets/animals.txt",
        async: false,
        success: function (data){
            pageExecute.fileContents = data;
        }
    });
}