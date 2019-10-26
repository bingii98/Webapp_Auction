const AWS = require('aws-sdk');
const bcrypt = require('bcrypt-nodejs');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
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
function getAll_Product_Admin(ejs, res) {
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
                        let count = 0;
                        for (var c in element.auction) {
                            count = count + 1;
                        }
                        var obj = Object.assign(element, { ownerName: item.businessName }, { id: item.businessID }, { loai: cat.categoryName }, { count: count });
                        productList.push(obj);
                    });
                });
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
                            console.log(count);
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

                res.render(ejs, { _uG: productList });
            });
        }
    });
}

//Push danh sách loại sản phẩm
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
                        console.log(item1)
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

//Push Auction for Product
function add_Auction(ObjectB, productID, res) {
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
                                    UpdateExpression: "set category[" + x + "].product[" + z + "].auction =:auc",
                                    ExpressionAttributeValues: {
                                        ":auc": {
                                            auctionName: ObjectB.auctionName,
                                            startDate: ObjectB.startDate,
                                            timeRun: ObjectB.timeRun,
                                            startPrice: ObjectB.startPrice,
                                            isRunning: true,
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

//Del Auction for Product
function delete_Auction(ObjectB, productID, res) {
    if (ObjectB.owner === "admin") {
        console.log("1a");
        let params = {
            TableName: 'Admins'
        };
        console.log("2a");
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
                                console.log("3a");
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
        console.log("1b");
        let params = {
            TableName: 'Businesss',
            Key: {
                businessID: ObjectB.businessID,
                businessName: ObjectB.owner,
            }
        }
        console.log("2b");
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
                                console.log("3b");
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

module.exports = {
    get_Item_Admin_Username: get_Item_Admin_Username,
    getAll_Category: getAll_Category,
    add_Product: add_Product,
    getAll_Product_Admin: getAll_Product_Admin,
    add_Auction: add_Auction,
    delete_Auction: delete_Auction,
};