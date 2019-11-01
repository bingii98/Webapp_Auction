const AWS = require('aws-sdk');
const {performance} = require('perf_hooks');
var t0 = performance.now();

AWS.config.update({
    "region": "us-east-1",
    "endpoint": "http://localhost:8000",
});

var docClient = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: 'Customers',
};
console.log('Scanning Table.');

docClient.scan(params, onScan);

function onScan(err, data) {
    if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        console.log(`${JSON.stringify(data,null,2)}`);
    }
}
var t1 = performance.now();
console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
