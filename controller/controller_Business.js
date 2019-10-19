const AWS = require('aws-sdk');

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

function get_Items_Business_Key(id, name, location, res) {
    let params = {
        TableName: 'Businesss',
        Key: {
            "business": id,
        }
    }
    let scanObject = {};
    docClient.scan(params, (err, data) => {
        if (err) {
            scanObject.err = err;
        } else {
            scanObject.data = data;
        }
        res.render(location, { _uG: scanObject.data.Items, _name: name });
    });
}

function get_Account_Business_Exist_UserName(username) {
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
        if (!err) {
            if(data.Items.length != 0)
                return true;
            else
                return false;
        }
    });
}


function delete_Item_Business_Key(businessid, businessname, router, res) {

    var table = "Businesss";
    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: table,
        Key: {
            "businessID": businessid,
            "businessName": businessname
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
                    adress: ObjectB.adress,
                    email: ObjectB.email,
                    phone: ObjectB.phone,
                    username: ObjectB.username,
                    password: ObjectB.password,
                    category: [
                        {
                            catID: "CR_1",
                            catName: "Đồ điện tử",
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
                    res.writeHead(302, { 'Location': location });
                }
                res.end();
            });
        }
    });
}


module.exports = {
    getAll_Business: getAll_Business,
    getAll_Product_Business: getAll_Product_Business,
    get_Items_Business_Key: get_Items_Business_Key,
    delete_Item_Business_Key: delete_Item_Business_Key,
    add_Item_Business: add_Item_Business,
    get_Account_Business_Exist_UserName : get_Account_Business_Exist_UserName,
};