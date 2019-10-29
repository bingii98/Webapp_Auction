//============START CONFIG=============//
const AWS = require('aws-sdk'),
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    sharedsession = require("express-socket.io-session"),
    app = express(),
    ctlBsn = require('../controller/Business-controller'),
    ctlAdmin = require('../controller/Admin-controller'),
    ctlCtm = require('../controller/Customer-controller'),
    docClient = new AWS.DynamoDB.DocumentClient(),
    bcrypt = require('bcrypt-nodejs');

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
    "region": "us-east-1",
    "endpoint": "http://dynamodb.us-east-1.amazonaws.com",
});

var sess;
const server = app.listen(3000, () => { console.log("Server running at port 3000!") });
const io = require('socket.io').listen(server);

//SocketIO FUNCTION START
io.on("connection", function (socket) {

    //CHECK BUSINESS USER EXIST
    socket.on("Client_sent_data", function (username) {
        ctlBsn.check_Username(username).then(data => {
            if(data){
                socket.emit("Server_sent_data", true);
            }else{
                socket.emit("Server_sent_data", false);
            }
        })
    });

    //CHECK CUSTOMER USER EXIST
    socket.on("Customer_check_username", function (username) {
        ctlCtm.check_Username(username).then(data => {
            if(data){
                socket.emit("Server_reply_username", true);
            }else{
                socket.emit("Server_sent_data", false);
            }
        });
    });

    //CHECK CATEGORY USER EXIST
    socket.on("Client_sent_data_category", function (categoryName) {
        console.log(1);
        ctlAdmin.Check_Category(categoryName).then(data => {
            console.log(2);
            if(data){
                socket.emit("Server_sent_data_category", true);
            }else{
                socket.emit("Server_sent_data_category", false);
            }
        })
    });

    //GET ALL CATEGORY IN REALTIME
    socket.on("Client_sent_data_list_category", function () {
        ctlAdmin.GetAll_Category().then(data => {
            socket.emit("Server_sent_data_list_category", data);
        })
    });

    //JOIN ROOM AUCTION
    socket.on("JOIN_ROOM_AUCTION_CLIENT", function (RoomName) {
        socket.join(RoomName);
        socket.roomCustom = RoomName;
    })

    //ADD BID TO ADMIN PRODUCT
    socket.on("Client_sent_data_BID", function (productID, price, ownerID, ownerName, clientUserID, dateTime) {
        ctlAdmin.Add_Bid_Product(productID,price,clientUserID).then(data => {
            if (ownerID === "admin") {
                ctlAdmin.Get_Final_Bid(productID).then(data => {
                    io.sockets.in(socket.roomCustom).emit("Server_sent_data_BID", data,dateTime);
                })
            } else {
                ctlBsn.Get_Final_Bid(productID).then(data => {
                    io.sockets.in(socket.roomCustom).emit("Server_sent_data_BID", data,dateTime);
                })
            }
        })
    });

    //CHECK AND CREATE ORDER FOR USER HAVE BID FINAL
    socket.on("CREATE_ORDER_AUCTION_CLIENT", function (productID, userID, ownerID, ownerName) {
        if (ownerName === "admin") {
            ctlAdmin.Create_Order(productID, userID).then(data => {
                if(data){
                    socket.emit("CREATE_ORDER_AUCTION_SERVER", true);
                }else{
                    socket.emit("CREATE_ORDER_AUCTION_SERVER", false);
                }
            })
        } else {
            ctlBsn.Create_Order(productID, userID, ownerID, ownerName).then(data => {
                if(data){
                    socket.emit("CREATE_ORDER_AUCTION_SERVER", true);
                }else{
                    socket.emit("CREATE_ORDER_AUCTION_SERVER", false);
                }
            })
        }
    });
});


//LOGIN
app.get('/login', (req, res) => {
    res.render('login');
});

//LOG IN
app.post('/login', (req, res) => {
    const sess = req.session
    const username = req.body.username;
    const password = req.body.password;
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
        password: password,
        orders: [

        ]
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
    sess = req.session
    console.log("UserID " + sess.userID + " vừa đăng nhập!");
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
        ctlCtm.getAll_Customer("quanlyhoadon",res);
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
    const categoryName = req.body.categoryName;
    ctlAdmin.Create_Category(categoryName).then(data => {
        if(data){
            res.redirect('/quanlyloaisanpham');
        }
    })
});

//Update Category
app.post('/updateCategory', (req, res) => {
    var categoryID = req.body.categoryID;
    var categoryName = req.body.categoryName;

    ctlAdmin.Update_Category(categoryID,categoryName).then(data => {
        ctlBsn.Update_Category(categoryID,categoryName).then(data1 => {
            if(data){
                if(data1){
                    res.redirect('/quanlyloaisanpham');
                }
            }
        })
    })
});

//Delete Category
app.get('/deleteCategory', (req, res) => {
    var categoryID = req.query.categoryID;
    ctlAdmin.Delete_Category(categoryID).then(data => {
        if(data){
            res.redirect('/quanlyloaisanpham');
        }
    })
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
        ctlAdmin.get_Item_Product(req.query.ownerid, req.query.owner, req.query.sanpham, sess.userID, res)
    } else {
        res.render('login');
    }
});

//Create Auction
app.post('/createauction', (req, res) => {
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
        businessID: businessID,
        owner: sess.permission
    }
    if (sess.permission === "admin") {
        ctlAdmin.add_Auction(ObjectB, productID, res);
    } else {
        res.render('login');
    }
});

//Delete Auction
app.get('/deleteauction', (req, res) => {
    sess = req.session;
    const productID = req.query.productID;
    const businessID = req.query.businessID;
    const owner = req.query.owner;

    const ObjectB = {
        businessID: businessID,
        owner: owner
    }
    if (sess.permission === "admin") {
        ctlAdmin.delete_Auction(ObjectB, productID, res);
    } else {
        res.render('login');
    }
});

//Update order
app.post('/updateorder', (req, res) => {
    sess = req.session;
    ctlCtm.update_Order_Customer(sess.userID, req.body.productID, req.body.note, res);
});

app.get('/contact', (req, res) => {
    res.render('contact')
});


app.post('/checkout', (req,res) =>  {
    sess = req.session;
    var productID = req.body.productID;
    ctlCtm.add_Order_Customer(sess.userID,productID);
    ctlAdmin.Get_Product(productID).then(data => {
        if(data.auction.bids[data.auction.bids.length - 1].user === sess.userID){
            res.render('check-out', { _uG: data });
        }else{
            res.redirect("/");
        }
    });


})


//404 PAGE
app.use((req, res) => {
    res.status(404);
    res.render('404');
});