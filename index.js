const express = require('express');
const fs =require('fs');
const csv = require("fast-csv");
const app = express();
app.use(express.json());
app.use(express.static(`${__dirname}/public/views`));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/images', express.static(__dirname + '/public/images'));

app.use('/',(req,res)=>{
    res.sendFile(`${__dirname}/public/views/index.html`)}
);
// fs.readFile('assets/EOWL-v1.1.2/LF Delimited Format/A Words.txt', function (err, data) {
//     if (err) {
//        return console.error(err);
//     }
//     //console.log("Asynchronous read: " + data.toString());
//  });
 
//  // Synchronous read
//  var data = fs.readFileSync('input.txt');
//  console.log("Synchronous read: " + data.toString());

app.get('/validate/:word',(req, res) => { 
    let valid =false;//check if word is present
    let filename = (req.params.word.substring(0,1)).toUpperCase() +' Words.csv';
    console.log(filename+'  '+req.params.word);
    csv
    .fromPath("assets/EOWL-v1.1.2/CSV Format/"+filename)
    .on("data", function(data){
       // console.log(data);
        data.forEach(element => {
            
            if(element==req.params.word){
                console.log(element)
                valid=true;
                console.log(valid);
                res.send(valid);
            }
        });
    })
    .on("end", function(){
        console.log("done reading "+ filename);
    })
    .on("error",(e)=>{
        console.log('Error reading data : '+e.message);
    });
        
    res.send(valid);
    
})
app.listen(3000,() => {
    // console.log(__dirname+'\\logs\\access.log');
     console.log('listening to 3000');
 })