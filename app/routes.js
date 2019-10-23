//============START CONFIG=============//
const AWS = require('aws-sdk');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const Passport = require('passport');
const app = express();
const ctlBsn = require('../controller/Business-controller');
const ctlAdmin = require('../controller/Admin-controller');
const ctlCtm = require('../controller/Customer-controller');
const docClient = new AWS.DynamoDB.DocumentClient();
const flash = require('connect-flash');
const bcrypt = require('bcrypt-nodejs');

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

var sess;
const server = app.listen(3000, () => { console.log("Server running at port 3000!") });
const io = require('socket.io').listen(server);

//SocketIO FUNCTION START
io.on("connection", function (socket) {
    console.log("-------CONNECT: New connection at ID : " + socket.id + " - !");

    socket.on("disconnect", function () {
        console.log("-------DISCONNECT: ID " + socket.id + " was disconnect!");
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

    //CHECK CATEGORY USER EXIST
    socket.on("Client_sent_data_category", function (categoryName) {
        let params = {
            TableName: 'Admins',
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
                var abc = true;
                data.Items[0].category.forEach(element => {
                    if(categoryName === element.categoryName){
                        abc = false;
                    }
                });
                if(abc == false){
                    socket.emit("Server_sent_data_category", false);
                }else{
                    socket.emit("Server_sent_data_category", true);
                }
            }
        });
    });
});


// Hiển thị form login
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    sess = req.session
    username = req.body.username;
    password = req.body.password;
    console.log("Getting!");
    ctlAdmin.get_Item_Admin_Username(username).then((data) => {
        if (data.length === 1 && bcrypt.compareSync(password, data[0].password)) {
            sess.permission = "admin";
            res.writeHead(302, { 'Location': '/quanlydoanhnghiep' });
            res.end();
        } else {
            ctlBsn.get_Item_Business_Username(username).then((data) => {
                if (data.length === 1 && bcrypt.compareSync(password, data[0].password)) {
                    sess.permission = "business";
                    res.writeHead(302, { 'Location': '/quanlydoanhnghiep' });
                    res.end();
                } else {
                    ctlCtm.get_Item_Customer_Username(username).then((data) => {
                        if (data.length === 1 && bcrypt.compareSync(password, data[0].password)) {
                            sess.permission = "customer";
                            res.writeHead(302, { 'Location': '/' });
                            res.end();
                        } else {
                            res.writeHead(302, { 'Location': '/login' });
                            res.end();
                        }
                    });
                }
            });
        }
    });
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

//router trang chủ
app.get('/', function (req, res) {
    ctlBsn.getAll_Product_Business('index', res);
});

//router trang chủ
app.get('/daugia', function (req, res) {
    sess = req.session
    if (sess.permission === "customer") {
        ctlBsn.getAll_Product_Business('index', res);
    } else {
        res.render('login');
    }
});

//router admib
app.get('/admin', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        res.render('quanlysanpham');
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlysanpham', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        ctlBsn.getAll_Product_Business('quanlysanpham', res);
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlydoanhnghiep_sanpham', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        var id = req.query.businessID;
        var name = req.query.businessName;
        ctlBsn.get_Items_Business_Key(id, name, 'quanlysanpham_business', res);
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlyhoadon', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        res.render('quanlyhoadon');
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlykhachhang', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        res.render('quanlykhachhang');
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlydoanhnghiep', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        ctlBsn.getAll_Business('quanlydoanhnghiep', res);
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlysanpham', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        var id = req.query.businessID;
        ctlBsn.get_Items_Business_Key(id, 'quanlysanpham_business', res);
    } else {
        res.render('login');
    }
});

//router admib
app.get('/quanlyloaisanpham', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        ctlAdmin.getAll_Category('quanlyloaisanpham',res);
    } else {
        res.render('login');
    }
});


// Thêm loai sản phẩm ADMIN
app.post('/createCategory', function (req, res) {
    let params = {
        TableName: 'Admins'
    }

    docClient.scan(params, (err, data) => {

        const categoryName = req.body.categoryName;
        //Thêm items mới với ID tăng dần
        var categoryID = '';
        //Lấy ra ID items cuối cùng 
        if (err) {
            console.error('Error JSON:', JSON.stringify(err, null, 2));
        } else {
            //Tạo ra biến categoryID mới
            var count = Number(data.Items[0].category.length);
            console.log('Count: ' + count);
            if (count != 0) {
                var max = 0;
                data.Items[0].category.forEach(item => {
                    var index = Number(item.categoryID.match(/[^_]*$/));
                    if (index > max) {
                        max = index;
                    }
                });
                var indexN = max + 1;
                categoryID = "CG_" + indexN.toString();
            } else {
                categoryID = 'CG_1';
            }
            let params = {
                TableName: 'Admins',
                Key: {
                    "adminID": "admin",
                    "adminName": "admin"
                },
                UpdateExpression: "SET #category = list_append(#category, :categoryAdd)",
                ExpressionAttributeNames: { "#category": "category" },
                ExpressionAttributeValues: {
                    ':categoryAdd': [
                        {
                            'categoryID': String(categoryID),
                            'categoryName': String(categoryName)
                        }
                    ]

                },
                ReturnValues: "ALL_NEW"
            };

            docClient.update(params, (err, data) => {
                if (err) {
                    console.error(JSON.stringify(err, null, 2));
                } else {
                    res.writeHead(302, { 'Location': '/quanlyloaisanpham' });
                }
                res.end();
            })
        }
    })
});

//Xoa loai san pham
app.get('deleteCategory',(req,res) => {
    let params = {
        TableName: 'Admins',
        Key: {
            "adminID": "admin",
            "adminName": "admin"
        },
        UpdateExpression: "SET #category = remove(#category, :categoryRemove)",
        ExpressionAttributeNames: { "#category": "category" },
        ExpressionAttributeValues: {
            ':categoryRemove': [
                {
                    'categoryID': String(req.body.categoryID),
                    'categoryName': String(req.body.categoryName)
                }
            ]

        },
        ReturnValues: "ALL_NEW"
    };
    docClient.update(params, function (err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res.writeHead(302, { 'Location': '/quanlyloaisanpham' });
            console.log("UpdateItem succeeded:", JSON.stringify(data));
        }
        res.end();
    });
});


// Xoá sản phẩm
app.get('/deleteproduct', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
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
app.post('/createbusiness', function (req, res) {
    const businessName = req.body.businessName;
    const adress = req.body.adress;
    const phone = req.body.phone;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    const ObjectB = {
        businessName: businessName,
        adress: adress,
        phone: phone,
        email: email,
        username: username,
        password: bcrypt.hashSync(password)
    }
    ctlBsn.add_Item_Business(ObjectB, 'quanlydoanhnghiep', res);
});

// Xoá doanh nghiệp
app.get('/deletebusiness', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        var businessid = req.query.businessid;
        var businessname = req.query.businessname;
        ctlBsn.delete_Item_Business_Key(businessid, businessname, '/quanlydoanhnghiep', res);
    } else {
        res.render('login');
    }
});

// Sửa doanh nghiệp
app.get('/editBusiness', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
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

//Trnag dau gia
app.get('/sanphamdaugia', (req, res) => {
    res.render('auction-page');
});

app.get('/contact', (req, res) => {
    res.render('contact')
});


//404
app.use((req, res) => {
    res.status(404);
    res.render('404');
});