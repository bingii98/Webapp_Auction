const express = require('express');
const session = require('express-session')
const app = express();
var bodyParser = require('body-parser');
app.use(session({ login: false }));

//set view engine for project
app.set('view engine', 'ejs');
app.set('views', './views');

const AWS = require('aws-sdk');
let docClient = new AWS.DynamoDB.DocumentClient();

//static thư mục view để sử dụng css
app.use(express.static(__dirname + '/views'));

//router trang chủ
app.get('/', function (req, res) {
    let params = {
        TableName: 'Business',
    };
    let scanObject = {};
    docClient.scan(params, (err, data) => {
        if (err) {
            scanObject.err = err;
        } else {
            scanObject.data = data;
        }
        res.render('index', { _uG: scanObject.data.Items });
    });
});

//router admib
app.get('/admin', function (req, res) {
    res.render('quanlysanpham');
});


// Hiển thị form login
app.get('/login', function (req, res) {
    // Hiển thị trang và truyển lại những tin nhắn từ phía server nếu có
    res.render('login.ejs', { message: req.flash('loginMessage') });
});


// route middleware để kiểm tra một user đã đăng nhập hay chưa?
function isLoggedIn(req, res, next) {
    // Nếu một user đã xác thực, cho đi tiếp
    if (req.isAuthenticated())
        return next();
    // Nếu chưa, đưa về trang chủ
    res.redirect('/');
}

app.post('/login', function (req, res) {

});


//webapp run at port 3000
app.listen(3000, function () {
    console.log('Server running in port 3000! Now ....');
});