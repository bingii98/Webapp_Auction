const AWS = require('aws-sdk');
const bcrypt = require('bcrypt-nodejs');

AWS.config.update({
    "region": "us-east-1",
    "endpoint": "http://dynamodb.us-east-1.amazonaws.com",
});

let docClient = new AWS.DynamoDB.DocumentClient();

async function get_Item_Admin_Username(username) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: "Admins",
            IndexName: 'username_index',
            FilterExpression: 'username = :username',
            ExpressionAttributeValues: { ":username": username }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Error JSON:', JSON.stringify(err, null, 2));
            } else {
                resolve(data.Items);
            }
        });
    });
}

//Push danh sách Product của Admin và Business
function getAll_Product_Admin(ejs, userID,booleanB, res) {
    let params = {
        TableName: 'Businesss'
    }

    docClient.scan(params, (err, data) => {
        if (err) {
            console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            var productList = [];
            data.Items.forEach(item => {
                if(item.category.length > 0){
                    item.category.forEach(cat => {
                        if(cat.product.length){
                            cat.product.forEach(element => {
                                let count = 0; for (var c in element.auction) { count = count + 1; }
                                var obj = Object.assign(element, { ownerName: item.businessName }, { id: item.businessID }, { loai: cat.categoryName }, { count: count });
                                productList.push(obj);
                            });
                        }
                    });
                }
            });

            let params1 = {
                TableName: 'Admins'
            }

            docClient.scan(params1, (err, data) => {
                data.Items.forEach(item => {
                    item.category.forEach(cat => {
                        cat.product.forEach(element => {
                            let count = 0;
                            for (var c in element.auction) {
                                count = count + 1;
                            }
                            var obj = Object.assign(element, { ownerName: "admin" }, { id: "admin" }, { loai: cat.categoryName }, { count: count });
                            productList.push(obj);
                        });
                    });
                });
                productList.sort(function (a, b) {
                    var nameA = a.productName.toLowerCase(), nameB = b.productName.toLowerCase()
                    if (nameA < nameB) //sort string ascending
                        return -1
                    if (nameA > nameB)
                        return 1
                    return 0 //default return value (no sorting)
                });

                res.render(ejs, { _uG: productList , booleanB : booleanB, userID: userID });
            });
        }
    });
}

//get Product (not S)
function getItem_Product_Admin(customerID, productID, ownerID, ownerName, ejs, res) {
    if (ownerID === "admin") {
        params = {
            TableName: 'Admins',
            Key: {
                "adminID": "admin",
                "adminName": "admin"
            },
        }
        docClient.scan(params, (err, data) => {
            if (data.Items.length != 0) {
                data.Items.forEach(element => {
                    element.category.forEach(item => {
                        item.product.forEach(product => {
                            if (productID === product.productID) {
                                var obj = Object.assign(product, { customerID: customerID });
                                res.render(ejs, { _uG: obj });
                            }
                        });
                    });
                });
            }
        });
    } else {
        params = {
            TableName: 'Businesss',
            Key: {
                "businessID": ownerID,
                "businessName": ownerName
            },
        }
        docClient.scan(params, (err, data) => {
            if (data.Items.length != 0) {
                data.Items.forEach(element => {
                    element.category.forEach(item => {
                        item.product.forEach(product => {
                            if (productID === product.productID) {
                                var obj = Object.assign(product, { customerID: customerID });
                                res.render(ejs, { _uG: obj });
                            }
                        });
                    });
                });
            }
        });
    }
}

//Get danh sách loại sản phẩm
function getAll_Category(ejs, res) {
    let params = {
        TableName: 'Admins'
    }
    var CategoryList = [];
    docClient.scan(params, (err, data) => {
        if (err) {
            console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            data.Items.forEach(item => {
                item.category.forEach(cat => {
                    CategoryList.push(cat);
                });
            });

            res.render(ejs, { _uG: CategoryList });
        }
    });
}

//Thêm sản phẩm ADMIN
function add_Product(ObjectB, categoryID, location, res) {
    let params = {
        TableName: 'Admins'
    }
    docClient.scan(params, (err, data) => {
        var productID = '';
        if (err) {
            console.error('Error JSON:', JSON.stringify(err, null, 2));
        } else {
            var max = 0;
            data.Items.forEach(item => {
                item.category.forEach(element => {
                    element.product.forEach(item1 => {
                        var index = Number(item1.productID.match(/[^_]*$/));
                        if (index > max) {
                            max = index;
                        }
                    });
                });
            });
            productID = "ADPRD_" + (max + 1).toString();
        }
        //Import
        var index = Number(categoryID.match(/\d+/g)) - 1;
        let params = {
            TableName: 'Admins',
            Key: {
                "adminID": "admin",
                "adminName": "admin"
            },
            UpdateExpression: "SET #category[" + index + "].#product = list_append(#category[" + index + "].#product, :categoryAdd)",
            ExpressionAttributeNames: { "#category": "category", "#product": "product" },
            ExpressionAttributeValues: {
                ':categoryAdd': [
                    {
                        productID: productID,
                        productName: ObjectB.productName,
                        productDescribe: ObjectB.productDescribe,
                        productImage: "https://cdn.tgdd.vn/Files/2019/09/12/1197622/f4_800x600.jpg",
                        auction: {
                        }
                    }
                ],
            },
            ReturnValues: "ALL_NEW"
        };
        docClient.update(params, function (err, data) {
            if (err) {
                console.error("Error JSON:", JSON.stringify(err, null, 2));
            } else {
                res.redirect(location);
            }
        });
    });
}

//Get item Product
function get_Item_Product(id, owner, productID, userID, res) {
    if (owner === "admin") {
        params = {
            TableName: 'Admins',
            Key: {
                "adminID": "admin",
                "adminName": "admin"
            },
        }
        docClient.scan(params, (err, data) => {
            if (data.Items.length != 0) {
                data.Items.forEach(element => {
                    element.category.forEach(item1 => {
                        item1.product.forEach(item => {
                            if (item.productID === productID) {
                                var obj = Object.assign(item, { id: id }, { owner: owner }, { userID: userID });
                                res.render('auction-page', { _uG: obj });
                            }
                        });
                    });
                });
            }
        });
    } else {
        params = {
            TableName: 'Businesss',
            Key: {
                "businessID": id,
                "businessName": owner
            },
        }
        docClient.scan(params, (err, data) => {
            if (data.Items.length != 0) {
                data.Items.forEach(element => {
                    element.category.forEach(item1 => {
                        item1.product.forEach(item => {
                            if (item.productID === productID) {
                                var obj = Object.assign(item, { id: id }, { owner: owner }, { userID: userID });
                                res.render('auction-page', { _uG: obj });
                            }
                        });
                    });
                });
            }
        });
    }
}

//Push Auction for Product
function add_Auction(ObjectB, productID, res) {
    console.log(ObjectB);
    if (ObjectB.owner === "admin") {
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
                                    UpdateExpression: "set category[" + x + "].product[" + z + "].auction =:auc",
                                    ExpressionAttributeValues: {
                                        ":auc": {
                                            auctionName: ObjectB.auctionName,
                                            startDate: ObjectB.startDate,
                                            timeRun: ObjectB.timeRun,
                                            startPrice: ObjectB.startPrice,
                                            isRunning: true,
                                            winner: "null",
                                            bids: [

                                            ]
                                        },
                                    },
                                    ReturnValues: "UPDATED_NEW"
                                };
                                docClient.update(params, function (err, data) {
                                    if (err) {
                                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                    } else {
                                        res.redirect('/quanlydaugia');
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
                businessID: ObjectB.businessID,
                businessName: ObjectB.userName,
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
                                        "businessID": ObjectB.businessID,
                                        "businessName": ObjectB.userName
                                    },
                                    UpdateExpression: "set category[" + x + "].product[" + z + "].auction =:auc",
                                    ExpressionAttributeValues: {
                                        ":auc": {
                                            auctionName: ObjectB.auctionName,
                                            startDate: ObjectB.startDate,
                                            timeRun: ObjectB.timeRun,
                                            startPrice: ObjectB.startPrice,
                                            isRunning: true,
                                            winner: "null",
                                            bids: [

                                            ]
                                        },
                                    },
                                    ReturnValues: "UPDATED_NEW"
                                };
                                docClient.update(params, function (err, data) {
                                    if (err) {
                                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                    } else {
                                        res.redirect('/quanlysanpham_doanhnghiep');
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
}

//Del Auction for Product
function delete_Auction(ObjectB, productID, res) {
    if (ObjectB.owner === "admin") {
        let params = {
            TableName: 'Admins'
        };
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
                                    UpdateExpression: "set category[" + x + "].product[" + z + "].auction =:auc",
                                    ExpressionAttributeValues: {
                                        ":auc": {
                                        },
                                    },
                                    ReturnValues: "UPDATED_NEW"
                                };
                                docClient.update(params, function (err, data) {
                                    if (err) {
                                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                    } else {
                                        res.redirect('/quanlydaugia');
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
                businessID: ObjectB.businessID,
                businessName: ObjectB.owner,
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
                                    UpdateExpression: "set category[" + x + "].product[" + z + "].auction =:auc",
                                    ExpressionAttributeValues: {
                                        ":auc": {
                                        },
                                    },
                                    ReturnValues: "UPDATED_NEW"
                                };
                                docClient.update(params, function (err, data) {
                                    if (err) {
                                        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                                    } else {
                                        res.redirect('/quanlydaugia');
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
}

//CHECK CATEGORY USER EXIST
async function Check_Category(categoryName) {
    console.log("ABC");
    return new Promise((resolve, reject) => {
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
                    resolve(false);
                } else {
                    resolve(true);
                }
            }
        });
    });
}

//GET ALL CATEGORY TO LIST
async function GetAll_Category(categoryName) {
    return new Promise((resolve, reject) => {
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
                resolve(CategoryList);
            }
        });
    });
}

//ADD BID TO ADMIN PRODUCT
async function Add_Bid_Product(productID, price, clientUserID) {
    return new Promise((resolve, reject) => {
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
                                                user: clientUserID,
                                                amount: price,
                                                timeStamp: new Date().getTime(),
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
                                        resolve(true);
                                    }
                                });
                            }
                        }
                    }
                }
            };
        });
    });
}

//CREATE_ORDER_AUCTION_CLIENT
async function Create_Order(productID, userID) {
    return new Promise((resolve, reject) => {
        params = {
            TableName: 'Admins',
            Key: {
                "adminID": "admin",
                "adminName": "admin"
            },
        }
        docClient.scan(params, (err, data) => {
            if (data.Items.length != 0) {
                var productList = [];
                data.Items.forEach(item => {
                    item.category.forEach(cat => {
                        cat.product.forEach(element => {
                            if (productID === element.productID) {
                                element.auction.bids.forEach(bid => {
                                    productList.push(bid);
                                });
                            }
                        });
                    });
                });
                productList.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
                if (userID === productList[productList.length - 1].user) {
                    ctlCtm.add_Order_Customer(userID, productID);
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

//CREATE CATEGORY
async function Create_Category(categoryName) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: 'Admins'
        }
        docClient.scan(params, (err, data) => {
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
                        resolve(data);
                    }
                })
            }
        })
    });
}

//UPDATE CATEGORY
async function Update_Category(categoryID, categoryName) {
    return new Promise((resolve, reject) => {
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
                                    resolve(true);
                                }
                            });
                        }
                    }
                }
            }
        });
    });
}

//UPDATE CATEGORY
async function Delete_Category(categoryID) {
    return new Promise((resolve, reject) => {
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
                                    resolve(true);
                                }
                            });
                        }
                    }
                }
            }
        });
    });
}

//GET FINAL BID OF PRODUCT (AUCTION)
async function Get_Final_Bid(productID) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: 'Admins',
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
                data.Items.forEach(item => {
                    item.category.forEach(category => {
                        category.product.forEach(product => {
                            if (product.productID == productID) {
                                if (product.auction.bids.length != 0) {
                                    resolve(product.auction.bids[product.auction.bids.length - 1]);
                                }
                            }
                        });
                    });
                })
            }
        });
    });
}

//GET PRODUCT (AUCTION)a
async function Get_Product(productID) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: 'Admins',
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
                data.Items.forEach(item => {
                    item.category.forEach(category => {
                        category.product.forEach(product => {
                            if (product.productID === productID) {
                                resolve(product);
                            }
                        });
                    });
                })
            }
        });
    });
}

//GET PRODUCT (AUCTION)a
async function Get_all_Category_admin() {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: 'Admins',
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
                data.Items.forEach(item => {
                    resolve(item.category);     
                })
            }
        });
    });
}

module.exports = {
    get_Item_Admin_Username: get_Item_Admin_Username,
    getAll_Category: getAll_Category,
    add_Product: add_Product,
    getAll_Product_Admin: getAll_Product_Admin,
    add_Auction: add_Auction,
    delete_Auction: delete_Auction,
    get_Item_Product: get_Item_Product,
    getItem_Product_Admin: getItem_Product_Admin,
    Check_Category: Check_Category,
    GetAll_Category: GetAll_Category,
    Add_Bid_Product: Add_Bid_Product,
    Create_Order: Create_Order,
    Create_Category: Create_Category,
    Update_Category: Update_Category,
    Delete_Category: Delete_Category,
    Get_Final_Bid: Get_Final_Bid,
    Get_Product: Get_Product,
    Get_all_Category_admin: Get_all_Category_admin,
};