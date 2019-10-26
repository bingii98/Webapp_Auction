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

//SET VIEW ENGINE
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

    //JOIN ROOM AUCTION
    socket.on("JOIN_ROOM_AUCTION_CLIENT", function(RoomName){
        socket.join(RoomName);
        socket.room = RoomName;
    })

    //Add BID to AUCTION
    socket.on("Client_sent_data_BID", function(productID,price, ownerID, ownerName) {
        if(ownerID === "admin"){
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
                                        UpdateExpression: "set category[" + x + "].product[" + z + "].auction.bids = list_append(category[" + x + "].product[" + z + "].auction.bids, :bidAdd)",
                                        ExpressionAttributeValues: {
                                            ":bidAdd": [
                                                {
                                                    user : sess.userID,
                                                    amount : price,
                                                    timeStamp : new Date().getTime(),
                                                }
                                            ],
                                        },
                                        ReturnValues: "UPDATED_NEW"
                                    };
                                    docClient.update(params, function (err, data) {
                                        if (err) {
                                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                        } else {
                                            //EMIT SERVER
                                            console.log(sess.userName);
                                            io.sockets.in(socket.room).emit("Server_sent_data_BID", sess.userName, price);
                                        }
                                    });
                                }
                            }
                        }
                    }
                };
            });
        }else{
            let params = {
                TableName: 'Businesss'
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
                                            "businessID": ownerID,
                                            "businessName": ownerName
                                        },
                                        UpdateExpression: "set category[" + x + "].product[" + z + "].auction.bids = list_append(category[" + x + "].product[" + z + "].auction.bids, :bidAdd)",
                                        ExpressionAttributeValues: {
                                            ":bidAdd": [
                                                {
                                                    user : sess.userID,
                                                    amount : price,
                                                    timeStamp : new Date().getTime(),
                                                }
                                            ],
                                        },
                                        ReturnValues: "UPDATED_NEW"
                                    };
                                    docClient.update(params, function (err, data) {
                                        if (err) {
                                            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                        } else {
                                            //EMIT SERVER
                                            socket.emit("Server_sent_data_BID", sess.userName, price);
                                        }
                                    });
                                }
                            }
                        }
                    }
                };
            });
        }
    });
});


//LOGIN
app.get('/login', (req, res) => {
    res.render('login');
});

//LOG IN
app.post('/login', (req, res) => {
    sess = req.session
    username = req.body.username;
    password = req.body.password;
    ctlAdmin.get_Item_Admin_Username(username).then((data) => {
        if (data.length === 1 && bcrypt.compareSync(password, data[0].password)) {
            sess.permission = "admin";
            sess.userID = "admin";
            sess.userName = "admin";
            res.redirect('/quanlysanpham');
        } else {
            ctlBsn.get_Item_Business_Username(username).then((data) => {
                if (data.length === 1 && bcrypt.compareSync(password, data[0].password)) {
                    sess.permission = "business";
                    sess.userID = data[0].businessID;
                    sess.userName = data[0].businessName;
                    res.redirect('/quanlysanpham');
                } else {
                    ctlCtm.get_Item_Customer_Username(username).then((data) => {
                        if (data.length === 1 && bcrypt.compareSync(password, data[0].password)) {
                            sess.permission = "customer";
                            sess.userID = data[0].customerID;
                            sess.userName = data[0].customerName;
                            console.log(sess.userName);
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

//LOG OUT
app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

//SIGN UP
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

//Create Customer
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

//Home Manager Admin Page
app.get('/', function (req, res) {
    ctlAdmin.getAll_Product_Admin('index', res);
});

//Product Manager Admin Page
app.get('/admin', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        ctlAdmin.getAll_Product_Admin('quanlysanpham', res);
    } else {
        res.render('login');
    }
});

//Product Manager Admin Page
app.get('/quanlysanpham', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        ctlAdmin.getAll_Product_Admin('quanlysanpham', res);
    } else {
        res.render('login');
    }
});

//Auction Manager Admin Page
app.get('/quanlydaugia', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        ctlAdmin.getAll_Product_Admin('quanlydaugia', res);
    } else {
        res.render('login');
    }
});

//Product - Business Manager Admin Page
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

//Order Manager Admin Page
app.get('/quanlyhoadon', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        res.render('quanlyhoadon');
    } else {
        res.render('login');
    }
});

//Customer Manager Admin Page
app.get('/quanlykhachhang', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        ctlCtm.getAll_Customer('quanlykhachhang', res);
    } else {
        res.render('login');
    }
});

//Business Manager Admin Page
app.get('/quanlydoanhnghiep', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        ctlBsn.getAll_Business('quanlydoanhnghiep', res);
    } else {
        res.render('login');
    }
});


//Category Manager Admin Page
app.get('/quanlyloaisanpham', function (req, res) {
    sess = req.session
    if (sess.permission === "admin") {
        ctlAdmin.getAll_Category('quanlyloaisanpham', res);
    } else {
        res.render('login');
    }
});


//Create Category
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

//Update Category
app.post('/updateCategory', (req, res) => {
    var categoryID = req.body.categoryID;
    var categoryName = req.body.categoryName;

    //Update for admin
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
                        let params = {
                            TableName: 'Admins',
                            Key: {
                                "adminID": "admin",
                                "adminName": "admin"
                            },
                            UpdateExpression: "SET category[" + i + "].categoryName = :vals",
                            ExpressionAttributeValues: {
                                ":vals": categoryName
                            }
                        };

                        docClient.update(params, function (err, data) {
                            if (err)
                                console.log(err);
                            else {
                                console.log("Update category succeeded for Admin");
                                res.redirect('/quanlyloaisanpham');
                            }
                        });
                    }
                }
            }
        }
    });

    //Update for Business
    let params1 = {
        TableName: 'Businesss',
    };
    docClient.scan(params1, function (err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            if(data.Items.length != 0){
                data.forEach(element => {
                    element.category.forEach(item => {
                        if(item.categoryID === categoryID){
                            let params = {
                                TableName: 'Businesss',
                                Key: {
                                    "businessID": element.businessID,
                                    "businessName": element.businessName
                                },
                                UpdateExpression: "SET category[" + i + "].categoryName = :vals",
                                ExpressionAttributeValues: {
                                    ":vals": categoryName
                                }
                            };
    
                            docClient.update(params, function (err, data) {
                                if (err)
                                    console.log(err);
                                else {
                                    console.log("Update category succeeded for " + item.businessName);
                                    res.redirect('/quanlyloaisanpham');
                                }
                            });
                        }
                    });
                });
            }
        }
    });
});

//Delete Category
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

//Create Product
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

//Delete Product
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

//Update Product
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

//Add Business
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

//Delete Business
app.get('/deletebusiness', function (req, res) {
    var businessid = req.query.businessid;
    var businessname = req.query.businessname;
    ctlBsn.delete_Item_Business_Key(businessid, businessname, '/quanlydoanhnghiep', res);
});

//Update Business
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

//Update Customer
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

//Delete Customer
app.get('/deleteCustomer', function (req, res) {
    var customerID = req.query.customerID;
    ctlCtm.delete_Item_Customer_Key(customerID, '/quanlykhachhang', res);
});

//Auction Page
app.get('/sanphamdaugia', (req, res) => {
    sess = req.session
    if (sess.permission === "customer") {
        ctlAdmin.get_Item_Product(req.query.ownerid,req.query.owner,req.query.sanpham,sess.userName,res)
    } else {
        res.render('login');
    }
});

//Create Auction
app.post('/createauction', (req,res) =>{
    sess = req.session;
    const auctionName = req.body.auctionName;
    const startDate = req.body.startDate;
    const timeRun = req.body.timeRun;
    const startPrice = req.body.startPrice;
    const productID = req.body.productID;
    const businessID = req.body.businessID;

    const ObjectB = {
        auctionName: auctionName,
        startDate: startDate,
        timeRun: timeRun,
        startPrice: startPrice,
        businessID : businessID,
        owner : sess.permission
    }
    if (sess.permission === "admin") {
        ctlAdmin.add_Auction(ObjectB,productID,res);
    } else {
        res.render('login');
    }
});

//Delete Auction
app.get('/deleteauction', (req,res) =>{
    sess = req.session;
    const productID = req.query.productID;
    const businessID = req.query.businessID;
    const owner = req.query.owner;

    const ObjectB = {
        businessID : businessID,
        owner : owner
    }
    if (sess.permission === "admin") {
        ctlAdmin.delete_Auction(ObjectB,productID,res);
    } else {
        res.render('login');
    }
});

app.get('/contact', (req, res) => {
    res.render('contact')
});


//404 PAGE
app.use((req, res) => {
    res.status(404);
    res.render('404');
});