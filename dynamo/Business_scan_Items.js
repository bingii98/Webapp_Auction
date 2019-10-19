const AWS = require('aws-sdk');

AWS.config.update({
    region: "CNM",
    endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: 'Businesss',
};
console.log('Scanning Table.');

docClient.scan(params, onScan);


function onScan(err, data) {
    if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        data.Items.forEach(item => {
            console.log(' ');
            console.log('=========== Business: ' + item.businessName + " ===========");
            console.log('| -- ID: ' + item.businessID);
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
