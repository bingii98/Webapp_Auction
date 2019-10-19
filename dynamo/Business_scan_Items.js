const AWS = require('aws-sdk');
const {performance} = require('perf_hooks');
const ctlBsn = require('../controller/controller_Business');
var t0 = performance.now();
AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: 'Businesss',
    IndexName: "username_index",
    FilterExpression: "#username = :username",
    ExpressionAttributeNames: {
        "#username": "username",
    },
    ExpressionAttributeValues: { ":username": 'bingii98' }
};
console.log('Scanning Table.');

docClient.scan(params, onScan);

function onScan(err, data) {
    if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        if(data.Items.length != 0){
            console.log("Co");
        }else{
            console.log("Khong");
        }
        data.Items.forEach(item => {
            console.log(' ');
            console.log('=========== Business: ' + item.businessName + " ===========");
            console.log('| -- ID: ' + item.businessID);
            console.log('| -- Username: ' + item.user);
            item.category.forEach(cat => {
                console.log('| -- Category: ' + cat.catName);
                cat.product.forEach(element => {
                    console.log('|    ---- Product: ' + element.productName);
                });
            });
            console.log('===========================================');
            console.log(' ');
        });
    }
}
var t1 = performance.now();
console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");

if(ctlBsn.get_Account_Business_Exist_UserName("bingii98")){
    console.log(" - Co");
}else{
    console.log(" - Khong");
}