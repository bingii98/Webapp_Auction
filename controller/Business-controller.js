const AWS = require('aws-sdk');
const bcrypt = require('bcrypt-nodejs');
var ctlAdmin = require('../controller/Admin-controller')

AWS.config.update({
    "region": "us-east-1",
    "endpoint": "http://localhost:8000",
});


let docClient = new AWS.DynamoDB.DocumentClient();

function getAll_Business(ejs, res) {
    let params = {
        TableName: 'Businesss'
    }

    docClient.scan(params, (err, data) => {
        if (err) {
            console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            res.render(ejs, { _uG: data.Items });
        }
    });
}

//CHECK USERNAME EXISTS
async function check_Username(username) {
    return new Promise((resolve, reject) => {
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
                                resolve(true);
                            } else {
                                resolve(false);
                            };
                        }
                    });
                } else {
                    resolve(false);
                };
            }
        });
    });
}

function getAll_Product_Business(ejs, res) {
    let params = {
        TableName: 'Businesss'
    }

    docClient.scan(params, (err, data) => {
        if (err) {
            console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            var productList = [];

            data.Items.forEach(item => {
                item.category.forEach(cat => {
                    cat.product.forEach(element => {
                        productList.push(element);
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
            })

            productList.sort(function (a, b) {
                var dateA = new Date(a.auction.startDate), dateB = new Date(b.auction.startDate)
                return dateA - dateB //sort by date ascending
            });

            res.render(ejs, { _uG: productList });
        }
    });
}

//Get listProduct of 1 BUSINESS
function get_Items_Business_Key(id, name, location, res) {
    let params = {
        TableName: 'Businesss',
        Key: {
            "businessID": id,
            "businessName": name
        },
        FilterExpression: 'businessID = :businessID',
        ExpressionAttributeValues: { ":businessID": id }
    }
    docClient.scan(params, (err, data) => {
        if (err) {
            console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            var productList = [];

            data.Items.forEach(item => {
                item.category.forEach(cat => {
                    cat.product.forEach(element => {
                        let count = 0;
                        for (var c in element.auction) {
                            count = count + 1;
                        }
                        var obj = Object.assign(element, { ownerName: name }, { id: id }, { loai: cat.categoryName }, { count: count });
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

            res.render(location, { _uG: productList });
        }
    });
}

//Update Business isStatus = false
function delete_Item_Business_Key(businessid, businessname, router, res) {
    var table = "Businesss";
    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: table,
        Key: {
            "businessID": businessid,
            "businessName": businessname
        },
        UpdateExpression: "set isStatus = :isStatus",
        ExpressionAttributeValues: {
            ":isStatus": false,
        },
        ReturnValues: "UPDATED_NEW"
    };

    docClient.update(params, function (err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res.redirect(router);
        }
    });
}

//ADD NEW BUSINESS - EMTY CATEGORY
function add_Item_Business(ObjectB, location, res) {
    let params = {
        TableName: 'Businesss'
    }

    docClient.scan(params, (err, data) => {
        //Thêm items mới với ID tăng dần
        var businessID = '';
        //Lấy ra ID items cuối cùng 
        if (err) {
            console.error('Error JSON:', JSON.stringify(err, null, 2));
        } else {
            //Tạo ra biến BusinessID mới
            var count = Number(data.Items.length);
            if (count != 0) {
                var max = 0;
                data.Items.forEach(item => {
                    var index = Number(item.businessID.match(/[^_]*$/));
                    if (index > max) {
                        max = index;
                    }
                });
                var indexN = max + 1;
                businessID = "BSN_" + indexN.toString();
            } else {
                businessID = 'BSN_1';
                console.log('Count: ' + count);
            }

            let params = {
                TableName: 'Businesss',
                Item: {
                    businessID: businessID,
                    businessName: ObjectB.businessName,
                    isStatus: true,
                    address: ObjectB.address,
                    email: ObjectB.email,
                    phone: ObjectB.phone,
                    username: ObjectB.username,
                    password: ObjectB.password,
                    category: [
                    ]
                },
            };

            docClient.put(params, (err, data) => {
                if (err) {
                    console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
                } else {
                    console.log('Added An Item', JSON.stringify(params));
                    res.redirect(location);
                }
            });
        }
    });
}

//ADD PRODUCT BUSINESS
async function add_Product(ObjectB, categoryName, username) {
    return new Promise((resolve, reject) => {
        Check_Category_Exists(username, categoryName).then(data => {
            if (data) {
                QueryCreateProduct(ObjectB, username, categoryName).then(data => {
                    resolve(true);
                });
            } else {
                Create_Category(categoryName, username).then(data => {
                    if (data) {
                        QueryCreateProduct(ObjectB, username, categoryName).then(data => {
                            resolve(true);
                        });;
                    }
                })
            }
        })
    });
}


//QUERY CREATE PRODUCT
async function QueryCreateProduct(ObjectB, username, categoryName) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: 'Businesss',
            IndexName: 'username_index',
            FilterExpression: 'username = :username',
            ExpressionAttributeValues: { ":username": username }

        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Error JSON:', JSON.stringify(err, null, 2));
            } else {
                var index = '';
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

                var productID = data.Items[0].businessID + "PRD_" + (max + 1).toString();

                data.Items[0].category.forEach(item => {
                    if (categoryName === item.categoryName) {
                        index = Number(item.categoryID.match(/\d+/g)) - 1
                    }
                    let params = {
                        TableName: 'Businesss',
                        Key: {
                            "businessID": data.Items[0].businessID,
                            "businessName": data.Items[0].businessName
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
                            resolve(true);
                        }
                    });
                })
            }
        })
    })
}

//CREATE CATEGORY
async function Create_Category(categoryName, username) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: 'Businesss',
            IndexName: 'username_index',
            FilterExpression: 'username = :username',
            ExpressionAttributeValues: { ":username": username }

        }
        docClient.scan(params, (err, data) => {
            //Lấy ra ID items cuối cùng 
            if (err) {
                console.error('Error JSON:', JSON.stringify(err, null, 2));
            } else {
                console.log()
                //Thêm items mới với ID tăng dần
                var categoryID = '';
                var businessID = data.Items[0].businessID;
                var businessName = data.Items[0].businessName;
                var count = Number(data.Items[0].category.length);
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
                    TableName: 'Businesss',
                    Key: {
                        "businessID": businessID,
                        "businessName": businessName
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
                        resolve(true);
                    }
                })
            }
        })
    });
}

//CHECK CATEGORY EXISTS
async function Check_Category_Exists(username, categoryName) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: 'Businesss',
            IndexName: 'username_index',
            FilterExpression: 'username = :username',
            ExpressionAttributeValues: { ":username": username }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Error JSON:', JSON.stringify(err, null, 2));
            } else {
                data.Items.forEach(element => {
                    var count = 0;
                    element.category.forEach(item => {
                        if (item.categoryName === categoryName) {
                            count++;
                        }
                    })
                    if (count == 0) {
                        resolve(false)
                    } else {
                        resolve(true)
                    }
                })
            }
        });
    });
}


function edit_Item_Business(ObjectB, location, res) {
    let params = {
        TableName: 'Businesss',
        Key: {
            "businessID": ObjectB.businessID,
            "businessName": ObjectB.businessName,
        },
        UpdateExpression: "set address =:a, phone =:p, email =:e",
        ExpressionAttributeValues: {
            ":a": ObjectB.address,
            ":p": ObjectB.phone,
            ":e": ObjectB.email
        },
        ReturnValues: "UPDATED_NEW"
    }
    docClient.update(params, function (err, data) {
        if (err) {
            console.log(`${JSON.stringify(err, null, 2)}`);
        } else {
            res.redirect(location);
        }
    });
}

async function get_Item_Business_Username(username) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: "Businesss",
            IndexName: 'username_index',
            FilterExpression: 'username = :username',
            ExpressionAttributeValues: { ":username": username }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data.Items);
            }
        });
    });
}

async function get_ListProduct_Business_Username(username) {
    return new Promise((resolve, reject) => {
        let params1 = {
            TableName: "Businesss",
            IndexName: 'username_index',
            FilterExpression: 'username = :username',
            ExpressionAttributeValues: { ":username": username }
        }
        docClient.scan(params1, (err, data) => {
            if (err) {
                console.error('Error JSON:', JSON.stringify(err, null, 2));
            } else {
                data.Items.forEach(item => {
                    var productList = [];
                    item.category.forEach(cat => {
                        cat.product.forEach(element => {
                            let count = 0;
                            for (var c in element.auction) {
                                count = count + 1;
                            }
                            if (count != 0) {
                                var obj = Object.assign(element, { ownerName: data.Items[0].businessName }, { id: data.Items[0].businessID }, { loai: cat.categoryName });
                                productList.push(obj);
                            }
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
                    console.log(productList);
                    resolve(productList);
                });
            }
        });
    });
}

//ADD BID TO ADMIN PRODUCT
async function Add_Bid_Product(productID, price, ownerID, ownerName, clientUserID) {
    return new Promise((resolve, reject) => {
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
async function Create_Order(productID, userID, ownerID, ownerName) {
    return new Promise((resolve, reject) => {
        params = {
            TableName: 'Businesss',
            Key: {
                "businessID": ownerID,
                "businessName": ownerName
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

//UPDATE CATEGORY
async function Update_Category(categoryID, categoryName) {
    return new Promise((resolve, reject) => {
        let params1 = {
            TableName: 'Businesss',
        };
        docClient.scan(params1, function (err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                if (data.Items.length != 0) {
                    data.forEach(element => {
                        element.category.forEach(item => {
                            if (item.categoryID === categoryID) {
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
                                        resolve(true);
                                    }
                                });
                            }
                        });
                    });
                };
            };
        });
    });
}


//ADD BID TO ADMIN PRODUCT
async function Add_Bid_Product(productID, price, clientUserID, businessID, businessName) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: 'Businesss',
            Key: {
                "businessID": businessID,
                "businessName": businessName
            },
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
                                        "businessID": businessID,
                                        "businessName": businessName
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


//GET FINAL BID OF PRODUCT (AUCTION)
async function Get_Final_Bid(productID, ownerID, ownerName) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: 'Businesss',
            Key : {
                "businessID" : ownerID,
                "businessName" : ownerName
            }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
            } else {
                if(err){
                    console.error("Error JSON:", JSON.stringify(err, null, 2));
                }else{
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
            }
        });
    });
}


//GET PRODUCT (AUCTION)
async function Get_Product(productID,ownerID,ownerName) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: 'Businesss',
            Key : {
                "businessID" : ownerID,
                "businessName" : ownerName
            }
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

module.exports = {
    getAll_Business: getAll_Business,
    getAll_Product_Business: getAll_Product_Business,
    get_Items_Business_Key: get_Items_Business_Key,
    delete_Item_Business_Key: delete_Item_Business_Key,
    add_Item_Business: add_Item_Business,
    edit_Item_Business: edit_Item_Business,
    get_Item_Business_Username: get_Item_Business_Username,
    check_Username: check_Username,
    Add_Bid_Product: Add_Bid_Product,
    Create_Order: Create_Order,
    Update_Category: Update_Category,
    add_Product: add_Product,
    get_ListProduct_Business_Username: get_ListProduct_Business_Username,
    Get_Final_Bid: Get_Final_Bid,
    Get_Product: Get_Product,
};