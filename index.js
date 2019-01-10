const express = require('express');
const fs =require('fs')
const app = express();
app.use(express.json());

// fs.readFile('assets/EOWL-v1.1.2/LF Delimited Format/A Words.txt', function (err, data) {
//     if (err) {
//        return console.error(err);
//     }
//     //console.log("Asynchronous read: " + data.toString());
//  });
 
//  // Synchronous read
//  var data = fs.readFileSync('input.txt');
//  console.log("Synchronous read: " + data.toString());

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/validate/:word',(req, res) => { 
    let valid = false;//check if word is present
    let filename = (req.params.word.substring(0,1)).toUpperCase() +' Words.csv';
    fs.readFile('assets/EOWL-v1.1.2/CSV Format/'+filename, function (err, data) {
        if (err) {
           return console.error(err);
        }
        //console.log("Asynchronous read: " + data.toString());
        data.forEach((w,i) => {
            console.log(i);
        });
        if(data.toString().indexOf(req.params.word)>-1){
            valid=true;
        }
     });
    
    res.send(valid)
})
app.listen(3000,() => {
    // console.log(__dirname+'\\logs\\access.log');
     console.log('listening to 3000');
 })