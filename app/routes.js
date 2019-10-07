const express = require('express');
const app = express();

//set view engine for project
app.set('view engine', 'ejs');
app.set('views', './views');

const AWS = require('aws-sdk');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

let docClient = new AWS.DynamoDB.DocumentClient();

//static thư mục view để sử dụng css
app.use(express.static('./views'));

//router trang chủ
app.get('/', function (req, res) {
    var page = req.params.page || 1;
    let params = {
        TableName: 'Business'
    }
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

//router admib
app.get('/quanlysanpham', function (req, res) {
    let params = {
        TableName: 'Admins'
    }
    let scanObject = {};
    docClient.scan(params, (err, data) => {
        if (err) {
            scanObject.err = err;
        } else {
            scanObject.data = data;
        }
        res.render('quanlysanpham', { _uG: scanObject.data.Items });
    });
});

//router admib
app.get('/quanlyhoadon', function (req, res) {
    res.render('quanlyhoadon');
});

//router admib
app.get('/quanlykhachhang', function (req, res) {
    res.render('quanlykhachhang');
});

//router admib
app.get('/quanlyloaisanpham', function (req, res) {
    res.render('quanlyloaisanpham');
});


// Hiển thị form login
app.get('/login', function (req, res) {
    // Hiển thị trang và truyển lại những tin nhắn từ phía server nếu có
    res.render('login.ejs', { message: req.flash('loginMessage') });
});

// Thêm sản phẩm ADMIN
app.get('/createproduct', function (req, res) {
    const adminID = 'Admin';
    const adminName = 'Admin';
    const dateAuc = req.query.dateAuc;
    const timeRun = req.query.timerun;
    const productid = "_10";
    const productName = req.query.name;;
    const catID = "cat1";
    const productDescribe = req.query.des;
    const productImage = makeid(20);
    const productPrice = Number(req.query.price);

    let params = {
        TableName: 'Admins',
        Key: {
            "adminID": adminID,
            "adminName": adminName
        },
        UpdateExpression: "SET #product = list_append(#product, :productAdd)",
        ExpressionAttributeNames: { "#product": "product" },
        ExpressionAttributeValues: {
            ':productAdd': [
                {
                    'productid': String(productid),
                    'productName': String(productName),
                    'dateAuc': String(dateAuc),
                    'timeRun': String(timeRun),
                    'catID': String(catID),
                    'productDescribe': String(productDescribe),
                    'productImage': String(productImage),
                    'productPrice': Number(productPrice)
                }
            ]

        },
        ReturnValues: "ALL_NEW"
    };

    docClient.update(params, (err, data) => {
        if (err) {
            console.error(JSON.stringify(err, null, 2));
        } else {
            res.writeHead(302, { 'Location': '/quanlysanpham' });
        }
        res.end();
    })
});


// Xoá sản phẩm
app.get('/deleteproduct', function (req, res) {
    var businessid = req.query.businessid;
    var businessname = req.query.businessname;
    var index = "REMOVE product[" + req.query.index + "]";
    console.log(JSON.stringify(index));
    var params = {
        TableName: "Business",
        Key: {
            "businessID": businessid,
            "businessName": businessname
        },
        UpdateExpression: index,
        ReturnValues: "UPDATED_NEW"
    };

    console.log("Updating the item: " + businessid + " - " + businessname);
    docClient.update(params, function (err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res.writeHead(302, { 'Location': '/quanlysanpham' });
            console.log("UpdateItem succeeded:", JSON.stringify(data));
        }
        res.end();
    });
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

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}