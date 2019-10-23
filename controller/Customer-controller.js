const AWS = require('aws-sdk');
const bcrypt = require('bcrypt-nodejs');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
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

function delete_Item_Customer_Key(customerID, router, res) {
    var table = "Customers";
    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: table,
        Key: {
            "customerID": customerID,
        }
    };

    docClient.delete(params, function (err, data) {
        if (err) {
            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res.writeHead(302, { 'Location': router });
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
        }
        res.end();
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
                    address: ObjectB.address,
                    email: ObjectB.email,
                    phone: ObjectB.phone,
                    username: ObjectB.username,
                    password: bcrypt.hashSync(ObjectB.password)
                },
            };

            docClient.put(params, (err, data) => {
                if (err) {
                    console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
                } else {
                    console.log('Added An Item', JSON.stringify(params));
                    res.writeHead(302, { 'Location': location });
                }
                res.end();
            });
        }
    });
}

function edit_Item_Business(ObjectB, location, res) {
    let params = {
        TableName: 'Customers',
        Key: {
            "customerID": ObjectB.customerID,
        },
        UpdateExpression: "set adress =:a, phone =:p, email =:e",
        ExpressionAttributeValues: {
            ":a": ObjectB.adress,
            ":p": ObjectB.phone,
            ":e": ObjectB.email
        },
        ReturnValues: "UPDATED_NEW"
    }
    docClient.update(params, function (err, data) {
        if (err) {
            console.log(`${JSON.stringify(err, null, 2)}`);
        } else {
            res.writeHead(302, { 'Location': location });
        }
        res.end();
    });
}

async function get_Item_Customer_Username(username) {
    return new Promise((resolve, reject) => {
        let params = {
            "TableName": "Customers",
            "IndexName": "username_index",
            "KeyConditions": {
                "username": {
                    "ComparisonOperator": "EQ",
                    "AttributeValueList": [{ "S": username }]
                }
            }
        }
        docClient.scan(params, (err, data) => {
            if (err) {
                console.error('Error JSON:', JSON.stringify(err, null, 2));
            } else {
                resolve(data.Items.length);
            }
        });
    });
}


module.exports = {
    getAll_Customer: getAll_Customer,
    get_Item_Customer_Username: get_Item_Customer_Username,
    delete_Item_Customer_Key: delete_Item_Customer_Key,
    add_Item_Customer: add_Item_Customer,
    edit_Item_Business: edit_Item_Business,
};