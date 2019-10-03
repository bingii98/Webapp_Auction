const express = require('express');
const app = express();

//set view engine for project
app.set('view engine','ejs');
app.set('views','./views');

//static thư mục view để sử dụng css
app.use(express.static(__dirname + '/views'));

//router trang chủ
app.get('/', function (req, res) {
    res.render('index');
});

//webapp run at port 3000
app.listen(3000, function () {
    console.log('Server running in port 3000! Now ....');
});