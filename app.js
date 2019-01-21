const cities = require("all-the-cities")
let s;
s= cities.filter(city => {
    return city.name.match('Varanasi');
  });
console.log(s); 

let gameName = 'nasgarth'
let gameid = `GAM-${gameName.substring(0, 3)}-${uuidv4().toString().substring(1, 4)}-${Date.now()}-${uuidv4().toString().substring(1, 4)}`;
console.log(gameid);

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}