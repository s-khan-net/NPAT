const express = require('express');
const router = express.Router();
const fs = require('fs');

router.get('/thing/:word',async (req,res)=>{
    let valid =false;//check if word is present
    let filename = (req.params.word.substring(0,1)).toUpperCase() +' Words.txt';
    console.log(filename+'  '+req.params.word);
    var data = fs.readFileSync(`assets/LF Delimited Format/${filename}`,'UTF-8');
    data.split(/\n/).forEach(element => {
        if(element==req.params.word){
            valid=true;
        }
    });
    res.send(valid);
});
router.get('/animal/:word',async (req,res)=>{
    let valid =false;//check if word is present
    console.log(req.params.word);
    var data = fs.readFileSync(`assets/animals.txt`,'UTF-8');
    data.split(/\n/).forEach(element => {
        if(element==req.params.word){
            valid=true;
        }
    });
    res.send(valid);
});
module.exports = router;