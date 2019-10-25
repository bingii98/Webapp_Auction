const AWS = require('aws-sdk');

AWS.config.update({
  region: "CNM",
  endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();

let params = {
  TableName: 'Admins',
  Key: {
    "adminID": "admin",
    "adminName": "admin"
  },
  UpdateExpression: "SET #category[0].#product = list_append(#category[0].#product, :categoryAdd)",
  ExpressionAttributeNames: { "#category": "category", "#product" : "product" },
  ExpressionAttributeValues: {
    ':categoryAdd': [
      {
        'categoryID': "String(categoryID)",
        'categoryName': "String(categoryName)",
        'isStatus': true,
      }
    ]

  },
  ReturnValues: "ALL_NEW"
};

docClient.update(params, (err, data) => {
  if (err) {
    console.error(JSON.stringify(err, null, 2));
  } else {
  }
})