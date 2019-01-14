const cities = require("all-the-cities")
let s,d;
s= cities.filter(city => {
    return city.name.match('mumbai');
  });
console.log(s);