const express = require('express');
const router = express.Router();
const fs = require('fs');
const cities = require("all-the-cities")

router.get('/thing/:word',async (req,res)=>{
    let valid =false;//check if word is present
    let filename = (req.params.word.substring(0,1)).toUpperCase() +' Words.txt';
    //console.log(filename+'  '+req.params.word);
    var data = fs.readFileSync(`assets/thing/${filename}`,'UTF-8');
    data.split(/\n/).forEach(element => {
        if(element.toLowerCase()==req.params.word.toLowerCase()){
            console.log(`found thingy ${element}`);
            valid=true;
        }
    });
    res.send(valid);
});
router.get('/animal/:word',async (req,res)=>{
    let valid =false;//check if word is present
   // console.log(req.params.word);
    var data = fs.readFileSync(`assets/animals.txt`,'UTF-8');
    data.split(/\n/).forEach(element => {
        if(element.toLowerCase()==req.params.word.toLowerCase()){
            console.log(`found animal ${element}`);
            valid=true;
        }
    });
    res.send(valid);
});
router.get('/place/:word',async (req,res)=>{
    let valid =false;//check if word is present
    var data = fs.readFileSync(`assets/countries_1`,'UTF-8');
    data.split(/\n/).forEach(element => {
        if(element.toLowerCase()==req.params.word.toLowerCase()){
            console.log(`found country ${element}`);
            valid=true;
        }
    });
    if(!valid){
        var x = '';
        req.params.word.toLowerCase().split(' ').forEach(e=>{
            x += capitalizeFirstLetter(e)+' ';
        });
        let s = cities.filter(city => {
            return city.name.match(x.substr(0,x.length-1));
        });
        s.forEach(element => {
            if(element.name.toLowerCase()==req.params.word.toLowerCase()){
                console.log(`found city ${element.name}`);
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