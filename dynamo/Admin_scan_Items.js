const AWS = require('aws-sdk');
const {performance} = require('perf_hooks');
var t0 = performance.now();
AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: 'Admins',
};
console.log('Scanning Table.');

docClient.scan(params, onScan);

function onScan(err, data) {
    if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        for (let index = 0; index < data.Items.length; index++) {
            console.log(' ');
            console.log('=========== Admins: ' + data.Items[index].adminName + " ===========");
            console.log('| -- ID: ' + data.Items[index].adminID);
            console.log('| -- Name: ' + data.Items[index].adminName);
            console.log('| -- Username: ' + data.Items[index].username);
            console.log('| -- Password: ' + data.Items[index].password);
            for (let i = 0; i < data.Items[index].category.length; i++) {
                console.log('| -- Category: ' + data.Items[index].category[i].categoryName);
            }
            console.log('===========================================');
            console.log(' ');
        }
    }
}
var t1 = performance.now();
console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
