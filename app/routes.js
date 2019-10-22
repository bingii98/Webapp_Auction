//============START CONFIG=============//
var express = require('express');
var app = express();
var server = app.listen(3000, function () {
    console.log("Server running at port 3000!")
});
var io = require('socket.io').listen(server);
var ctlBsn = require('../controller/controller_Business');

//set view engine for project
app.set('view engine', 'ejs');
app.set('views', './views');

var AWS = require('aws-sdk');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000'
});

let docClient = new AWS.DynamoDB.DocumentClient();

//static thư mục view để sử dụng css
app.use(express.static('./views'));

//============END CONFIG=============//


//SocketIO FUNCTION START
io.on("connection", function (socket) {
    console.log("CONNECT: New connection at ID : " + socket.id + " - !");

    socket.on("disconnect", function () {
        console.log("DISCONNECT: ID " + socket.id + " was disconnect!");
    });

    //CHECK BUSINESS USER EXIST
    socket.on("Client_sent_data", function (username) {
        let params = {
            TableName: 'Businesss',
            IndexName: "username_index",
            FilterExpression: "#username = :username",
            ExpressionAttributeNames: {
                "#username": "username",
            },
            ExpressionAttributeValues: { ":username": username }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
                if (data.Items.length == 0) {
                    socket.emit("Server_sent_data", true);
                } else { 
                    socket.emit("Server_sent_data", false);
                };
            }
        });
    });

});

//router trang chủ
app.get('/', function (req, res) {
    ctlBsn.getAll_Product_Business('index', res);
});

//router trang chủ
app.get('/daugia', function (req, res) {
    ctlBsn.getAll_Product_Business('index', res);
});

//router admib
app.get('/admin', function (req, res) {
    res.render('quanlysanpham');
});

//router admib
app.get('/quanlysanpham', function (req, res) {
    ctlBsn.getAll_Product_Business('quanlysanpham', res);
});

//router admib
app.get('/quanlydoanhnghiep_sanpham', function (req, res) {
    var id = req.query.businessID;
    var name = req.query.businessName;
    ctlBsn.get_Items_Business_Key(id, name, 'quanlysanpham_business', res);
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
app.get('/quanlydoanhnghiep', function (req, res) {
    ctlBsn.getAll_Business('quanlydoanhnghiep', res);
});

//router admib
app.get('/quanlysanpham', function (req, res) {
    var id = req.query.businessID;
    ctlBsn.get_Items_Business_Key(id, 'quanlysanpham_business', res);
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

// Thêm doanh nghiệp
app.get('/createbusiness', function (req, res) {

    const businessName = req.query.businessName;
    const adress = req.query.adress;
    const phone = req.query.phone;
    const email = req.query.email;
    const username = req.query.username;
    const password = req.query.password;

    const ObjectB = {
        businessName: businessName,
        adress: adress,
        phone: phone,
        email: email,
        username: username,
        password: password
    }

    ctlBsn.add_Item_Business(ObjectB, 'quanlydoanhnghiep', res);
});

// Xoá doanh nghiệp
app.get('/deletebusiness', function (req, res) {
    var businessid = req.query.businessid;
    var businessname = req.query.businessname;
    ctlBsn.delete_Item_Business_Key(businessid, businessname, '/quanlydoanhnghiep', res);
});

// Sửa doanh nghiệp
app.get('/editBusiness', function (req, res) {
    const businessID = req.query.businessID;
    const businessName = req.query.businessName;
    const adress = req.query.adress;
    const phone = req.query.phone;
    const email = req.query.email;

    const ObjectB = {
        businessID : businessID,
        businessName: businessName,
        adress: adress,
        phone: phone,
        email: email,
    }

    ctlBsn.edit_Item_Business(ObjectB, '/quanlydoanhnghiep', res);
});


app.post('/login', function (req, res) {

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