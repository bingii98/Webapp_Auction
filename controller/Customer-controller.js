const AWS = require('aws-sdk');
const bcrypt = require('bcrypt-nodejs');

AWS.config.update({
    "region": "us-east-1",
    "endpoint": "http://localhost:8000",
});

let docClient = new AWS.DynamoDB.DocumentClient();

function getAll_Customer(ejs, res) {
    let params = {
        TableName: 'Customers'
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

function delete_Item_Customer_Key(customerID, location, res) {
    var table = "Customers";
    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: table,
        Key: {
            "customerID": customerID,
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
            res.redirect(location);
        }
    });
}

function add_Item_Customer(ObjectB, location, res) {
    let params = {
        TableName: 'Customers'
    }

    docClient.scan(params, (err, data) => {
        //Thêm items mới với ID tăng dần
        var customerID = '';
        //Lấy ra ID items cuối cùng 
        if (err) {
            console.error('Error JSON:', JSON.stringify(err, null, 2));
        } else {
            //Tạo ra biến CustomerID mới
            var count = Number(data.Items.length);
            if (count != 0) {
                var max = 0;
                data.Items.forEach(item => {
                    var index = Number(item.customerID.match(/[^_]*$/));
                    if (index > max) {
                        max = index;
                    }
                });
                var indexN = max + 1;
                customerID = "CM_" + indexN.toString();
            } else {
                customerID = 'CM_1';
                console.log('Count: ' + count);
            }
            console.log('customerID: ' + customerID);
            //Import
            let params = {
                TableName: 'Customers',
                Item: {
                    customerID: customerID,
                    customerName: ObjectB.customerName,
                    isStatus: true,
                    address: ObjectB.address,
                    email: ObjectB.email,
                    phone: ObjectB.phone,
                    username: ObjectB.username,
                    password: bcrypt.hashSync(ObjectB.password),
                    orders : [

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

function edit_Item_Customer(ObjectB, location, res) {
    let params = {
        TableName: 'Customers',
        Key: {
            "customerID": ObjectB.customerID,
        },
        UpdateExpression: "set customerName =:n, address =:a, phone =:p, email =:e",
        ExpressionAttributeValues: {
            ":n": ObjectB.customerName,
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

async function get_Item_Customer_Username(username) {
    return new Promise((resolve, reject) => {
        let params = {
            TableName: "Customers",
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

function add_Order_Customer(customerID, productID) {
    console.log("Create order .....!")
    let params = {
        TableName: 'Customers',
        Key: {
            "customerID": customerID,
        },
        UpdateExpression: "SET #orders = list_append(#orders, :order)",
        ExpressionAttributeNames: { "#orders": "orders" },
        ExpressionAttributeValues: {
            ':order': [
                {
                    'productID': productID,
                    'deliverMethod': "null",
                    'paymentMethod': "null",
                    'Note': "null",
                }
            ]

        },
        ReturnValues: "UPDATED_NEW"
    }
    docClient.update(params, function (err, data) {
        if (err) {
            console.log(`${JSON.stringify(err, null, 2)}`);
        }
    });
}

function update_Order_Customer(customerID,productID,note,res){

    console.log("Update order .....!")
    let params = {
        TableName: 'Customers',
        Key: {
            "customerID": customerID,
        },
    }
    docClient.scan(params, (err, data) => {
        if (err) {
            console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
        } else {
            data.Items.forEach(item => {
                item.orders.forEach(order => {
                    if(order.productID === productID){
                        let params = {
                            TableName: 'Customers',
                            Key: {
                                "customerID": customerID,
                            },
                            UpdateExpression: "SET orders["+ (item.orders.length - 1) +"] = :order",
                            ExpressionAttributeValues: {
                                ':order': 
                                    {
                                        'productID': productID,
                                        'deliverMethod': "Giao hành nhanh",
                                        'paymentMethod': "Thanh toán khi nhận hàng",
                                        'Note': note,
                                    }
                            },
                            ReturnValues: "UPDATED_NEW"
                        }
                        docClient.update(params, function (err, data) {
                            if (err) {
                                console.log(`${JSON.stringify(err, null, 2)}`);
                            } else {
                                console.log(4);
                                res.redirect('/');
                            }
                        });
                    }
                })
            })
        }
    });
};


module.exports = {
    getAll_Customer: getAll_Customer,
    get_Item_Customer_Username: get_Item_Customer_Username,
    delete_Item_Customer_Key: delete_Item_Customer_Key,
    add_Item_Customer: add_Item_Customer,
    edit_Item_Customer: edit_Item_Customer,
    add_Order_Customer: add_Order_Customer,
    update_Order_Customer: update_Order_Customer,
    check_Username: check_Username,
};