//require('dotenv').load();
// const cities = require("all-the-cities")
// let s;
// s= cities.filter(city => {
//     return city.name.match('Varanasi');
//   });
// console.log(s); 

// let gameName = 'nasgarth'
// let gameid = `GAM-${gameName.substring(0, 3)}-${uuidv4().toString().substring(1, 4)}-${Date.now()}-${uuidv4().toString().substring(1, 4)}`;
// console.log(gameid);

// function uuidv4() {
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//     var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16);
//   });
// }
var replace = require("replace-in-file");
var fs = require('fs');
console.log(process.env.PORT);
var data = fs.readFileSync(`assets/names.txt`,'UTF-8');
let array = data.split(/\n/);
let chk=0;
let e1='';
for (let index = 0; index < array.length; index++) {
    e1 = array[chk];
    for (let i = chk+1; i < array.length; i++) {
        if(e1==array[i]){
            //remove 
            console.log(e1);
            console.log(`found ${i}`);
            const options = {
                files: 'assets/names.txt',
                from: e1,
                to: i,
              };
              replace(options)
                .then(changes => {
                    console.log('Modified files:', changes.join(', '));
                })
                .catch(error => {
                    console.error('Error occurred:', error);
                });
        }
        
    }
    chk++;
}