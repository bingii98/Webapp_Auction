const express = require('express');
const app = express();
const businessController = require('./controller/businessCrl');

//set view engine for project
app.set('view engine', 'ejs');
app.set('views', './views');

const AWS = require('aws-sdk');
let dynamodb = new AWS.DynamoDB();

//static thư mục view để sử dụng css
app.use(express.static(__dirname + '/views'));

//router trang chủ
app.get('/', function (req, res) {
    var params = {
        TableName: 'Business',
    };
    dynamodb.scan(params, function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(JSON.stringify(data.Items[1].contact.adress));
            res.render('index', { _uG: data.Items });
        }
    });
});

//webapp run at port 3000
app.listen(3000, function () {
    console.log('Server running in port 3000! Now ....');
});