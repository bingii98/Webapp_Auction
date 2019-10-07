const AWS = require('aws-sdk');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: 'Admins',
};
console.log('Scanning Books table.');

docClient.scan(params, onScan);
function onScan(err, data) {
    if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        console.log('Scan succeeded.');
        data.Items.forEach((item) => {
            item.product.forEach((product) => {
                var d = new Date(product.dateAuc);
                var nd = new Date();
                console.log(`${JSON.stringify(item.adminID)} - ${JSON.stringify(item.adminName)}  - ${JSON.stringify(product.productid)} - ${JSON.stringify(product.productName)} - ${JSON.stringify(product.dateAuc)}`);
            })
        });

        if (typeof data.LastEvaluatedKey !== 'undefined') {
            console.log('Scanning for more...');
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
    }
}
