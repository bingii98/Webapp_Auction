const AWS = require('aws-sdk');

AWS.config.update({
  "region": "us-east-1",
  "endpoint": "http://dynamodb.us-east-1.amazonaws.com",
});

const docClient = new AWS.DynamoDB.DocumentClient();
var index = Number("CG_2".match(/\d+/g)) - 1;
let params = {
  TableName: 'Admins',
  Key: {
    "adminID": "admin",
    "adminName": "admin"
  },
  UpdateExpression: "SET #category[" + index + "].#product = list_append(#category[" + index + "].#product, :categoryAdd)",
  ExpressionAttributeNames: { "#category": "category", "#product": "product" },
  ExpressionAttributeValues: {
    ':categoryAdd': [
      {
        productID: "productID",
        productName: ObjectB.productName,
        productDescribe: ObjectB.productDescribe,
        productImage: "https://cdn.tgdd.vn/Files/2019/09/12/1197622/f4_800x600.jpg",
        auction: {
        }
      }
    ],
  },
  ReturnValues: "ALL_NEW"
};

docClient.update(params, (err, data) => {
  if (err) {
    console.error(JSON.stringify(err, null, 2));
  } else {
  }
})