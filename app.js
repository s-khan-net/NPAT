var csv = require("fast-csv");
 
csv
 .fromPath("assets/EOWL-v1.1.2/CSV Format/A Words.csv")
 .on("data", function(data){
     console.log(data);
 })
 .on("end", function(){
     console.log("done");
 });