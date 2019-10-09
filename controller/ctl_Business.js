const AWS = require('aws-sdk');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

let docClient = new AWS.DynamoDB.DocumentClient();

function getAll_Items_Business(location, res) {
    let params = {
        TableName: 'Business'
    }
    let scanObject = {};
    docClient.scan(params, (err, data) => {
        if (err) {
            scanObject.err = err;
        } else {
            scanObject.data = data;
        }
        res.render(location, { _uG: scanObject.data.Items });
    });
}

function get_Items_Business_Key(id, name, location, res) {
    let params = {
        TableName: 'Business',
        Key:{
            "businessID": id,   
        }
    }
    let scanObject = {};
    docClient.scan(params, (err, data) => {
        if (err) {
            scanObject.err = err;
        } else {
            scanObject.data = data;
        }
        res.render(location, { _uG: scanObject.data.Items, _name : name });
    });
}


function delete_Item_Business_Key(businessid, businessname, location, res) {

    var table = "Business";
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
            res.writeHead(302, { 'Location': location });
            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
        }
        res.end();
    });
}

function add_Item_Business(ObjectB, location, res) {

    let params1 = {
        TableName: 'Business'
    }

    docClient.scan(params1, (err, data) => {

        var businessID = '';

        if (err) {
            console.error('Error JSON:', JSON.stringify(err, null, 2));
        } else {
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

            console.log("ID: " + businessID);
            const businessName = ObjectB.businessName;
            const adress = ObjectB.adress;
            const phone = ObjectB.phone;
            const email = ObjectB.email;
            const username = ObjectB.username;
            const password = ObjectB.password;
            const params = {
                TableName: 'Business',
                Item: {
                    businessID,
                    businessName,
                    contact: {
                        adress,
                        phone,
                        email
                    },
                    account: {
                        username,
                        password
                    },
                    product: [
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
    getAll_Items_Business: getAll_Items_Business,
    get_Items_Business_Key: get_Items_Business_Key,
    delete_Item_Business_Key: delete_Item_Business_Key,
    add_Item_Business: add_Item_Business,
};