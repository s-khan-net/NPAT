const express = require('express');
const router = express.Router();
const fs = require('fs');
//const cities = require("all-the-cities")

router.get('/thing/:word',async (req,res)=>{
    let valid =false;//check if word is present
    let filename = (req.params.word.substring(0,1)).toUpperCase() +' Words.txt';
    //console.log(filename+'  '+req.params.word);
    var data = fs.readFileSync(`assets/thing/${filename}`,'UTF-8');
    data.split(/\n/).forEach(element => {
        if(element.trim().toLowerCase()==req.params.word.trim().toLowerCase()){
            console.log(`found thingy ${element}`);
            valid=true;
        }
    });
    res.send(valid);
});
router.get('/animal/:word',async (req,res)=>{
    let valid =false;//check if word is present
    let filename = (req.params.word.substring(0,1)).toUpperCase() +'.txt';
    var data = fs.readFileSync(`assets/animals/${filename}`,'UTF-8');
    data.split(/\n/).forEach(element => {
      //  console.log(element);
        if(element.trim().toLowerCase()==req.params.word.trim().toLowerCase()){
            console.log(`found animal ${element}`);
            valid=true;
        }
    });
    res.send(valid);
});
router.get('/place/:word',async (req,res)=>{
    let valid =false;//check if word is present
    let filename = (req.params.word.substring(0,1)).toUpperCase() +'.txt';
    var data = fs.readFileSync(`assets/cities/${filename}`,'UTF-8');
    data.split(/\n/).forEach(element => {
        if(element.trim().toLowerCase()==req.params.word.trim().toLowerCase()){
            console.log(`found 1 ${element}`);
            valid=true;
        }
    });
    if(!valid){
        var x = '';
        req.params.word.trim().toLowerCase().split(' ').forEach(e=>{
            x += capitalizeFirstLetter(e)+' ';
        });

        var obj = JSON.parse(fs.readFileSync('assets/cities.json', 'utf8'));

        obj.forEach(o=>{
            if(o.name.trim().toLowerCase() == req.params.word.trim().toLowerCase()){
                console.log(`found 2 ${o.name}`);
                valid=true;
            }
        });
    }
    res.send(valid);
});
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
module.exports = router;