const express = require('express');
const config = require('config');
const users =require('./routes/users');
const words =require('./routes/words');
const app = express();
app.use(express.json());
app.use('/api/users',users);
app.use('/api/words',words);
app.use(express.static(`${__dirname}/public/views`));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/images', express.static(__dirname + '/public/images'));

// app.use('/',(req,res)=>{
//     res.sendFile(`${__dirname}/public/views/index.html`)}
// );
if(!config.get('jwtKey')) {
    console.log('FATAL ERROR: jwt token key not set');
    process.exit(1);
}
app.listen(3000,() => {
    // console.log(__dirname+'\\logs\\access.log');
     console.log('listening to 3000');
 })