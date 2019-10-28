const AWS = require('aws-sdk');

AWS.config.update({
    "region": "us-east-1",
    "endpoint": "http://dynamodb.us-east-1.amazonaws.com",
  });

const docClient = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: 'Businesss',
};
console.log('Scanning Books table.');

docClient.scan(params, onScan);
function onScan(err, data) {
    if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        console.log('Scan succeeded.');
        data.Items.forEach((item) => {
            var table = "Businesss";

            var id = item.businessID;
            var name = item.businessName;

            var params = {
                TableName: table,
                Key: {
                    "businessID": id,
                    "businessName": name
                }
            };

            console.log("Attempting a conditional delete...");
            docClient.delete(params, function (err, data) {
                if (err) {
                    console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                }
            });
        });

        if (typeof data.LastEvaluatedKey !== 'undefined') {
            console.log('Scanning for more...');
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
    }
}
