const AWS = require('aws-sdk');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();

const table = 'Admins';

const adminID = 'Admin';
const adminName = 'Admin';
const dateAuc = "Fri Oct 07 2019 01:42:00 GMT+0700 (Indochina Time)";
const timeRun = 120;
const address = makeid(20);
const phone = makeid(20);
const email = 'october15th98@gmail.com';
const username = 'admin';
const password = 'admin';
const productid = adminID.toString() + "_0";
const productName = makeid(10);
const catID = "cat1";
const productDescribe = makeid(300);
const productImage = makeid(20);
const productPrice = 20000;
const params = {
    TableName: table,
    Item: {
        adminID,
        adminName,
        contact: {
            address,
            phone,
            email
        },
        account: {
            username,
            password
        },
        product: [
            {
                productid,
                productName,
                dateAuc,
                timeRun,
                catID,
                productDescribe,
                productImage,
                productPrice,
            }
        ]
    },
};

console.log('Adding a new business...');
docClient.put(params, (err, data) => {
    if (err) {
        console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        console.log('Added An Item', JSON.stringify(params));
    }
});

function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

