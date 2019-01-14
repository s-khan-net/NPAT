const express = require('express');
const router = express.Router();
const fs = require('fs');
const cities = require("all-the-cities")

router.get('/thing/:word',async (req,res)=>{
    let valid =false;//check if word is present
    let filename = (req.params.word.substring(0,1)).toUpperCase() +' Words.txt';
    //console.log(filename+'  '+req.params.word);
    var data = fs.readFileSync(`assets/LF Delimited Format/${filename}`,'UTF-8');
    data.split(/\n/).forEach(element => {
        if(element.toLowerCase()==req.params.word.toLowerCase()){
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
            valid=true;
        }
    });
    res.send(valid);
});
router.get('/place/:word',async (req,res)=>{
    let valid =false;//check if word is present
   console.log(req.params.word);
    var data = fs.readFileSync(`assets/countries_1`,'UTF-8');
    data.split(/\n/).forEach(element => {
        if(element.toLowerCase()==req.params.word.toLowerCase()){
            valid=true;
        }
    });
    if(!valid){
        let s = cities.filter(city => {
            return city.name.match(capitalizeFirstLetter(req.params.word.toLowerCase()));
        });
        console.log(s);
        if(s.length>0) valid=true
    }
    res.send(valid);
});
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
module.exports = router;