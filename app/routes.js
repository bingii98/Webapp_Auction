//============START CONFIG=============//
const AWS = require('aws-sdk');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const ctlBsn = require('../controller/Business-controller');
const ctlAdmin = require('../controller/Admin-controller');
const ctlCtm = require('../controller/Customer-controller');
const docClient = new AWS.DynamoDB.DocumentClient();
const bcrypt = require('bcrypt-nodejs');

//set view engine for project
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('./public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'FMS',
    maxAge: 8 * 60 * 60 * 1000, //8 hours
    httpOnly: true,
    secure: false,
    secureProxy: true,
}));

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000'
});

var sess;
const server = app.listen(3000, () => { console.log("Server running at port 3000!") });
const io = require('socket.io').listen(server);

//SocketIO FUNCTION START
io.on("connection", function (socket) {

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
                    if (categoryName === element.categoryName) {
                        abc = false;
                    }
                });
                if (abc == false) {
                    socket.emit("Server_sent_data_category", false);
                } else {
                    socket.emit("Server_sent_data_category", true);
                }
            }
        });
    });

    //Get all CATEGORY IN REALTIME
    socket.on("Client_sent_data_list_category", function () {
        let params = {
            TableName: 'Admins',
        }
        var CategoryList = [];
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
                data.Items.forEach(item => {
                    item.category.forEach(cat => {
                        if (cat.isStatus) {
                            CategoryList.push(cat);
                        }
                    });
                });
                console.log(CategoryList);
                socket.emit("Server_sent_data_list_category", CategoryList);
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
    ctlAdmin.get_Item_Admin_Username(username).then((data) => {
        if (data.length === 1 && bcrypt.compareSync(password, data[0].password)) {
            sess.permission = "admin";
            res.redirect('/quanlydoanhnghiep');
        } else {
            ctlBsn.get_Item_Business_Username(username).then((data) => {
                if (data.length === 1 && bcrypt.compareSync(password, data[0].password)) {
                    sess.permission = "business";
                    res.redirect('/quanlydoanhnghiep');
                } else {
                    ctlCtm.get_Item_Customer_Username(username).then((data) => {
                        if (data.length === 1 && bcrypt.compareSync(password, data[0].password)) {
                            sess.permission = "customer";
                            res.redirect('/');
                        } else {
                            res.redirect('/login');
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

app.post('/signup', function (req, res) {
    const customerName = req.body.customerName;
    const address = req.body.address;
    const phone = req.body.phone;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

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

app.post('/createCustomer', function (req, res) {
    const customerName = req.body.customerName;
    const address = req.body.address;
    const phone = req.body.phone;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    const ObjectB = {
        customerName: customerName,
        address: address,
        phone: phone,
        email: email,
        username: username,
        password: password
    }

    ctlCtm.add_Item_Customer(ObjectB, '/quanlykhachhang', res);
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
        ctlAdmin.getAll_Product_Admin('quanlysanpham', res);
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
        ctlCtm.getAll_Customer('quanlykhachhang', res);
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
app.get('/quanlyloaisanpham', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        ctlAdmin.getAll_Category('quanlyloaisanpham', res);
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
                            'categoryName': String(categoryName),
                            'isStatus': true,
                            'product': []
                        }
                    ]

                },
                ReturnValues: "ALL_NEW"
            };

            docClient.update(params, (err, data) => {
                if (err) {
                    console.error(JSON.stringify(err, null, 2));
                } else {
                    res.redirect('/quanlyloaisanpham');
                }
            })
        }
    })
});

//Xoa loai san pham
app.get('/deleteCategory', (req, res) => {
    var categoryID = req.query.categoryID;
    let params = {
        TableName: 'Admins',
        Key: {
            "adminID": "admin",
            "adminName": "admin"
        },
    };
    docClient.scan(params, function (err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            for (let index = 0; index < data.Items.length; index++) {
                for (let i = 0; i < data.Items[index].category.length; i++) {
                    if (data.Items[index].category[i].categoryID === categoryID) {
                        console.log(data.Items[index].category[i].categoryID);
                        let params = {
                            TableName: 'Admins',
                            Key: {
                                "adminID": "admin",
                                "adminName": "admin"
                            },
                            UpdateExpression: "SET category[" + i + "].isStatus = :vals",
                            ExpressionAttributeValues: {
                                ":vals": false
                            }
                        };

                        docClient.update(params, function (err, data) {
                            if (err)
                                console.log(err);
                            else {
                                console.log("UpdateItem succeeded:", JSON.stringify(data));
                                res.redirect('/quanlyloaisanpham');
                            }
                        });
                    }
                }
            }
        }
    });
});

//Thêm sản phẩm
app.post('/createproduct', (req, res) => {
    const productName = req.body.productName;
    const productDescribe = req.body.productDescribe;
    const categoryID = req.body.categoryID;

    const ObjectB = {
        productName: productName,
        productDescribe: productDescribe
    }
    ctlAdmin.add_Product(ObjectB, categoryID, '/quanlysanpham', res);
});

// Xoá sản phẩm
app.get('/deleteProduct', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        var owner = req.query.owner;
        var productID = req.query.productID;
        if (owner === "admin") {
            let params = {
                TableName: 'Admins'
            }
            docClient.scan(params, (err, data) => {
                if (err) {
                    console.error('Error JSON:', JSON.stringify(err, null, 2));
                } else {
                    for (let i = 0; i < data.Items.length; i++) {
                        for (let x = 0; x < data.Items[i].category.length; x++) {
                            for (let z = 0; z < data.Items[i].category[x].product.length; z++) {
                                if (data.Items[i].category[x].product[z].productID === productID) {
                                    let params = {
                                        TableName: "Admins",
                                        Key: {
                                            "adminID": "admin",
                                            "adminName": "admin"
                                        },
                                        UpdateExpression: "REMOVE category[" + x + "].product[" + z + "]",
                                        ReturnValues: "UPDATED_NEW"
                                    };
                                    docClient.update(params, function (err, data) {
                                        if (err) {
                                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                        } else {
                                            res.redirect('/quanlysanpham');
                                        }
                                    });
                                    break;
                                }
                            }
                        }
                    }
                };
            });
        } else {
            let params = {
                TableName: 'Businesss',
                Key: {
                    businessID: req.query.id,
                    businessName: owner,
                }
            }
            docClient.scan(params, (err, data) => {
                if (err) {
                    console.error('Error JSON:', JSON.stringify(err, null, 2));
                } else {
                    for (let i = 0; i < data.Items.length; i++) {
                        for (let x = 0; x < data.Items[i].category.length; x++) {
                            for (let z = 0; z < data.Items[i].category[x].product.length; z++) {
                                if (data.Items[i].category[x].product[z].productID === productID) {
                                    let params = {
                                        TableName: "Businesss",
                                        Key: {
                                            "businessID": req.query.id,
                                            "businessName": owner
                                        },
                                        UpdateExpression: "REMOVE category[" + x + "].product[" + z + "]",
                                        ReturnValues: "UPDATED_NEW"
                                    };
                                    docClient.update(params, function (err, data) {
                                        if (err) {
                                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                        } else {
                                            res.redirect('/quanlysanpham');
                                        }
                                    });
                                    break
                                }
                            }
                        }
                    }
                };
            });
        }
    } else {
        res.render('login');
    }
});


// Sửa sản phẩm
app.get('/editProduct', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        var owner = req.query.owner;
        var id = req.query.id;
        var productID = req.query.productID;
        var productName = req.query.productName;
        var productDescribe = req.query.productDescribe;
        if (owner === "admin") {
            let params = {
                TableName: 'Admins'
            }
            docClient.scan(params, (err, data) => {
                if (err) {
                    console.error('Error JSON:', JSON.stringify(err, null, 2));
                } else {
                    for (let i = 0; i < data.Items.length; i++) {
                        for (let x = 0; x < data.Items[i].category.length; x++) {
                            for (let z = 0; z < data.Items[i].category[x].product.length; z++) {
                                if (data.Items[i].category[x].product[z].productID === productID) {
                                    let params = {
                                        TableName: "Admins",
                                        Key: {
                                            "adminID": "admin",
                                            "adminName": "admin"
                                        },
                                        UpdateExpression: "set category[" + x + "].product[" + z + "].productName =:n, category[" + x + "].product[" + z + "].productDescribe =:d",
                                        ExpressionAttributeValues: {
                                            ":n": productName,
                                            ":d": productDescribe,
                                        },
                                        ReturnValues: "UPDATED_NEW"
                                    };
                                    docClient.update(params, function (err, data) {
                                        if (err) {
                                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                        } else {
                                            res.redirect('/quanlysanpham');
                                        }
                                    });
                                    break
                                }
                            }
                        }
                    }
                };
            });
        } else {
            let params = {
                TableName: 'Businesss',
                Key: {
                    businessID: req.query.id,
                    businessName: owner,
                }
            }
            docClient.scan(params, (err, data) => {
                if (err) {
                    console.error('Error JSON:', JSON.stringify(err, null, 2));
                } else {
                    for (let i = 0; i < data.Items.length; i++) {
                        for (let x = 0; x < data.Items[i].category.length; x++) {
                            for (let z = 0; z < data.Items[i].category[x].product.length; z++) {
                                if (data.Items[i].category[x].product[z].productID === productID) {
                                    let params = {
                                        TableName: "Businesss",
                                        Key: {
                                            "businessID": id,
                                            "businessName": owner
                                        },
                                        UpdateExpression: "set category[" + x + "].product[" + z + "].productName =:n, category[" + x + "].product[" + z + "].productDescribe =:d",
                                        ExpressionAttributeValues: {
                                            ":n": productName,
                                            ":d": productDescribe,
                                        },
                                    };
                                    docClient.update(params, function (err, data) {
                                        if (err) {
                                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                        } else {
                                            res.redirect('/quanlysanpham');
                                        }
                                    });
                                    break
                                }
                            }
                        }
                    }
                };
            });
        }
    } else {
        res.render('login');
    }
});

// Thêm doanh nghiệp
app.post('/createbusiness', function (req, res) {
    const businessName = req.body.businessName;
    const address = req.body.address;
    const phone = req.body.phone;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    const ObjectB = {
        businessName: businessName,
        address: address,
        phone: phone,
        email: email,
        username: username,
        password: bcrypt.hashSync(password)
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
    sess = req.session
    if (sess.permission === "admin") {
        const businessID = req.query.businessID;
        const businessName = req.query.businessName;
        const address = req.query.address;
        const phone = req.query.phone;
        const email = req.query.email;

        const ObjectB = {
            businessID: businessID,
            businessName: businessName,
            address: address,
            phone: phone,
            email: email,
        }
        ctlBsn.edit_Item_Business(ObjectB, '/quanlydoanhnghiep', res);
    } else {
        res.render('login');
    }
});

// Sửa khách hàng
app.post('/editCustomer', function (req, res) {
    sess = req.session
    const customerID = req.body.customerID;
    const customerName = req.body.customerName;
    const address = req.body.address;
    const phone = req.body.phone;
    const email = req.body.email;
    if (sess.permission === "admin") {
        const ObjectB = {
            customerID: customerID,
            customerName: customerName,
            address: address,
            phone: phone,
            email: email,
        }
        ctlCtm.edit_Item_Customer(ObjectB, '/quanlykhachhang', res);
    } else {
        res.render('login');
    }
});

// Xoá khách hàng
app.get('/deleteCustomer', function (req, res) {
    var customerID = req.query.customerID;
    ctlCtm.delete_Item_Customer_Key(customerID, '/quanlykhachhang', res);
});

//Trnag dau gia
app.get('/sanphamdaugia', (req, res) => {
    sess = req.session
    if (sess.permission === "customer") {
        res.render('auction-page');
    } else {
        res.render('login');
    }
});

app.get('/contact', (req, res) => {
    res.render('contact')
});


//404
app.use((req, res) => {
    res.status(404);
    res.render('404');
});