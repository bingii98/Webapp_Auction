const AWS = require('aws-sdk');
const bcrypt = require('bcrypt-nodejs');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
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

            //Import
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
                        {
                            catID: "CR_1",
                            categoryName: "Đồ điện tử",
                            product: [

                            ],
                        }
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


module.exports = {
    getAll_Business: getAll_Business,
    getAll_Product_Business: getAll_Product_Business,
    get_Items_Business_Key: get_Items_Business_Key,
    delete_Item_Business_Key: delete_Item_Business_Key,
    add_Item_Business: add_Item_Business,
    edit_Item_Business: edit_Item_Business,
    get_Item_Business_Username : get_Item_Business_Username,
};