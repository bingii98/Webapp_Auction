const AWS = require('aws-sdk');
const {performance} = require('perf_hooks');
var t0 = performance.now();
AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
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
        data.Items.forEach(item => {
            console.log(' ');
            console.log('=========== Customer: ' + item.customerName + " ===========");
            console.log('| -- ID: ' + item.customerID);
            console.log('| -- Username: ' + item.username);
            console.log('| -- Password: ' + item.password);
            console.log('===========================================');
            console.log(' ');
        });
    }
}
var t1 = performance.now();
console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
