//============START CONFIG=============//
const AWS = require('aws-sdk');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const Passport = require('passport');
const app = express();
const ctlBsn = require('../controller/Business-controller');
const ctlCtm = require('../controller/Customer-controller');
const ppUser = require('../controller/userPassport');
const docClient = new AWS.DynamoDB.DocumentClient();
const flash = require('connect-flash');

//set view engine for project
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('./views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "mysecret" }));
app.use(Passport.initialize());
app.use(Passport.session());
app.use(flash());
AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000'
});

const server = app.listen(3000, () => { console.log("Server running at port 3000!") });
const io = require('socket.io').listen(server);

//SocketIO FUNCTION START
io.on("connection", function (socket) {
    console.log("CONNECT: New connection at ID : " + socket.id + " - !");

    socket.on("disconnect", function () {
        console.log("DISCONNECT: ID " + socket.id + " was disconnect!");
    });

    //CHECK BUSINESS USER EXIST
    socket.on("Client_sent_data", function (username) {
        let params = {
            TableName: '    ',
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
                    let params = {
                        TableName: 'Customers',
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
                } else {
                    socket.emit("Server_sent_data", false);
                };
            }
        });
    });

    //CHECK CUSTOMER USER EXIST
    socket.on("Customer_check_username", function (username) {
        let params = {
            TableName: 'Customers',
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
                                socket.emit("Server_reply_username", true);
                            } else {
                                socket.emit("Server_reply_username", false);
                            };
                        }
                    });
                } else {
                    socket.emit("Server_reply_username", false);
                };
            }
        });
    });

});


// Hiển thị form login
app.get('/login',(req,res) => {
    res.render('login');
});

app.post('/login',(req,res) => {
    username = req.body.username;
    password = req.body.password;
    
});

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

app.get('/signup', function (req, res) {
    const customerName = req.query.customerName;
    const address = req.query.address;
    const phone = req.query.phone;
    const email = req.query.email;
    const username = req.query.username;
    const password = req.query.password;

    const ObjectB = {
        customerName: customerName,
        address: address,
        phone: phone,
        email: email,
        username: username,
        password: password
    }

    ctlCtm.add_Item_Customer(ObjectB, '/login', res);
});

ppUser.passportUser(Passport);

//router trang chủ
app.get('/', function (req, res) {
    ctlBsn.getAll_Product_Business('index', res);
});

//router trang chủ
app.get('/daugia', function (req, res) {
    if (req.isAuthenticated()) {
        ctlBsn.getAll_Product_Business('index', res);
    } else {
        res.render('login');
    }
});

//router admib
app.get('/admin', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('quanlysanpham');
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlysanpham', function (req, res) {
    if (req.isAuthenticated()) {
        ctlBsn.getAll_Product_Business('quanlysanpham', res);
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlydoanhnghiep_sanpham', function (req, res) {
    if (req.isAuthenticated()) {
        var id = req.query.businessID;
        var name = req.query.businessName;
        ctlBsn.get_Items_Business_Key(id, name, 'quanlysanpham_business', res);
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlyhoadon', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('quanlyhoadon');
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlykhachhang', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('quanlykhachhang');
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlydoanhnghiep', function (req, res) {
    if (req.isAuthenticated()) {
        ctlBsn.getAll_Business('quanlydoanhnghiep', res);
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlysanpham', function (req, res) {
    if (req.isAuthenticated()) {
        var id = req.query.businessID;
        ctlBsn.get_Items_Business_Key(id, 'quanlysanpham_business', res);
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlyloaisanpham', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('quanlyloaisanpham');
    } else {
        res.render('login');
    }
});


// Thêm sản phẩm ADMIN
app.get('/createproduct', function (req, res) {
    if (req.isAuthenticated()) {
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
    } else {
        res.render('login');
    }
});


// Xoá sản phẩm
app.get('/deleteproduct', function (req, res) {
    if (req.isAuthenticated()) {
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
    } else {
        res.render('login');
    }
});

// Thêm doanh nghiệp
app.get('/createbusiness', function (req, res) {
    if (req.isAuthenticated()) {
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
    } else {
        res.render('login');
    }
});

// Xoá doanh nghiệp
app.get('/deletebusiness', function (req, res) {
    if (req.isAuthenticated()) {
        var businessid = req.query.businessid;
        var businessname = req.query.businessname;
        ctlBsn.delete_Item_Business_Key(businessid, businessname, '/quanlydoanhnghiep', res);
    } else {
        res.render('login');
    }
});

// Sửa doanh nghiệp
app.get('/editBusiness', function (req, res) {
    if (req.isAuthenticated()) {
        const businessID = req.query.businessID;
        const businessName = req.query.businessName;
        const adress = req.query.adress;
        const phone = req.query.phone;
        const email = req.query.email;

        const ObjectB = {
            businessID: businessID,
            businessName: businessName,
            adress: adress,
            phone: phone,
            email: email,
        }

        ctlBsn.edit_Item_Business(ObjectB, '/quanlydoanhnghiep', res);
    } else {
        res.render('login');
    }
});

app.get('/contact', (req, res) => {
    res.render('contact')
})
