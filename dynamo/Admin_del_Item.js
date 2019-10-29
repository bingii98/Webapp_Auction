const AWS = require('aws-sdk');
const { performance } = require('perf_hooks');
var t0 = performance.now();

AWS.config.update({
    "region": "us-east-1",
    "endpoint": "http://localhost:8000",
});


const docClient = new AWS.DynamoDB.DocumentClient();
let params = {
    TableName: "Admins",
    Key: {
        "adminID": "admin",
        "adminName": "admin"
    },
    UpdateExpression: "REMOVE category[0].product[0]",
    ReturnValues: "UPDATED_NEW"
};
docClient.update(params, function (err, data) {
    if (err) {
        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
    }
});


