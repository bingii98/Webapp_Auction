const AWS = require('aws-sdk');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: 'Business',
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
                console.log(`${JSON.stringify(((d.getTime() - nd.getTime()) + product.timeRun*1000))}`);
            })
        });

        if (typeof data.LastEvaluatedKey !== 'undefined') {
            console.log('Scanning for more...');
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
    }
}
