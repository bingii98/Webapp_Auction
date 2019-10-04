const AWS = require('aws-sdk');

AWS.config.update({
    region: "CNM",
  endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();

const table = 'Business';

const businessID = 'BSN84590002';
const businessName = 'ABC';
const adress = 'Thiếu Nhi';
const phone = 'Tran Trung Nam';
const email = 'Tran Trung Nam';
const username = 'Không xe xe không cổ';
const password = 'Tran Trung Nam';
const productid = 'Tran Trung Nam';
const productName = 'Không xe xe không cổ';
const catID = 'Tran Trung Nam';
const productDescribe = 'Tran Trung Nam';
const productImage = 'Tran Trung Nam';
const productPrice = 'Tran Trung Nam';

const params = {
  TableName: table,
  Item: {
    businessID,
    businessName,
    contact : [
        adress,
        phone,
        email
    ],
    account : [
      username,
      password
    ],
    product : [
      {
        productid,
        productName,
        catID,
        productDescribe,
        productImage,
        productPrice,
      },
      {
        productid,
        productName,
        catID,
        productDescribe,
        productImage,
        productPrice,
      },
      {
        productid,
        productName,
        catID,
        productDescribe,
        productImage,
        productPrice,
      }
    ]
  },
};

console.log('Adding a new business...');
docClient.put(params, (err, data) => {
  if (err) {
    console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
  } else {
    console.log('Added An Item', JSON.stringify(params));
  }
});
