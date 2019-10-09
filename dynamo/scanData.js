const AWS = require('aws-sdk');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: 'Business',
    Key:{
        "businessID": "aaasasas",
        "businessName": "BSN_4"
    }
};
console.log('Scanning Books table.');

docClient.scan(params, onScan);


function onScan(err, data) {
    if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        console.error('Data:', JSON.stringify(data, null, 2));
    }
}
