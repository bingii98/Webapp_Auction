const AWS = require('aws-sdk');
var bcrypt = require('bcrypt-nodejs');

AWS.config.update({
  "region": "us-east-1",
  "endpoint": "http://dynamodb.us-east-1.amazonaws.com",
});

const docClient = new AWS.DynamoDB.DocumentClient();

let params = {
  TableName: 'Customers'
}

docClient.scan(params, (err, data) => {
  //Thêm items mới với ID tăng dần
  var customerID = '';

  //Lấy ra ID items cuối cùng 
  if (err) {
    console.error('Error JSON:', JSON.stringify(err, null, 2));
  } else {
    //Tạo ra biến BusinessID mới
    var count = Number(data.Items.length);
    if (count != 0) {
      var max = 0;
      data.Items.forEach(item => {
        var index = Number(item.customerID.match(/[^_]*$/));
        if (index > max) {
          max = index;
        }
      });
      var indexN = max + 1;
      customerID = "C_" + indexN.toString();
    } else {
      customerID = 'C_1';
      console.log('Count: ' + count);
    }

    //Import
    let params = {
      TableName: 'Customers',
      Item: {
        customerID: customerID,
        customerName: "Nguyen Giang",
        isStatus : true,
        address: "826 QUang Trung - Gò Vấp",
        email: "october15th98@gmail.com",
        phone: "0827374414",
        username: "bingii",
        password: bcrypt.hashSync("123")
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

