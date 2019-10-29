const AWS = require('aws-sdk');

AWS.config.update({
    "region": "us-east-1",
    "endpoint": "http://localhost:8000",
});

const docClient = new AWS.DynamoDB.DocumentClient();
const params = {
    TableName: 'Businesss',
};

docClient.scan(params, (err, data) => {
    if (err) {
        console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
    } else {
        var productList = [];

        data.Items.forEach(item => {
            item.category.forEach(cat => {
                cat.product.forEach(element => {
                    productList.push(element);
                });
            });
        });

        productList.sort(function(a, b){
            var nameA = a.productName.toLowerCase(), nameB=b.productName.toLowerCase()
            if (nameA < nameB) //sort string ascending
                return -1 
            if (nameA > nameB)
                return 1
            return 0 //default return value (no sorting)
        })
        console.log("\nSap xep theo Ten");
        productList.forEach(item => {
            console.log(item.productName);
        });

        productList.sort(function(a, b){
            var dateA=new Date(a.auction.startDate), dateB=new Date(b.auction.startDate)
            return dateA-dateB //sort by date ascending
        });
        console.log("\nSap xep theo ngay");
        productList.forEach(item => {
            console.log(item.productName);
        });
    }
});
