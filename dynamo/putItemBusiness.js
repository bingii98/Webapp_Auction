const AWS = require('aws-sdk');

AWS.config.update({
  region: "CNM",
  endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();

let params1 = {
  TableName: 'Business'
}

docClient.scan(params1, (err, data) => {

  var businessID = '';

  if (err) {
    console.error('Error JSON:', JSON.stringify(err, null, 2));
  } else {
    var count = Number(data.Items.length);
    if (count != 0) {
      var max = 0;
      data.Items.forEach(item => {
        var index = Number(item.businessID.match(/[^_]*$/));
        if(index > max){
          max = index;
        }
      });
      var indexN = max + 1;
      businessID = "BSN_" + indexN.toString();
    } else {
      businessID = 'BSN_1';
      console.log('Count: ' + count);
    }

    const dateAuc = "Fri Oct 07 2019 01:42:00 GMT+0700 (Indochina Time)";
    const timeRun = 120;
    const businessName = makeid(5);
    const adress = makeid(20);
    const phone = makeid(20);
    const email = makeid(20);
    const username = makeid(20);
    const password = makeid(20);
    const productid = businessID.toString() + "_0";
    const productName = makeid(10);
    const catID = "cat1";
    const productDescribe = makeid(300);
    const productImage = makeid(20);
    const productPrice = 20000;
    const params = {
      TableName: 'Business',
      Item: {
        businessName,
        businessID,
        contact: {
          adress,
          phone,
          email
        },
        account: {
          username,
          password
        },
        product: [
          {
            productid,
            productName,
            dateAuc,
            timeRun,
            catID,
            productDescribe,
            productImage,
            productPrice,
          }
        ]
      },
    };

    docClient.put(params, (err, data) => {
      if (err) {
        console.error('Unable to add item. Error JSON:', JSON.stringify(err, null, 2));
      } else {
        console.log('Added An Item')
      }
    });
  }
});

function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

