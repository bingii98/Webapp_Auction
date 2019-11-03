const AWS = require('aws-sdk');
const bcrypt = require('bcrypt-nodejs');

AWS.config.update({
  "region": "us-east-1",
  //"endpoint": "http://localhost:8000",
  "endpoint": "http://dynamodb.us-east-1.amazonaws.com"
});


const docClient = new AWS.DynamoDB.DocumentClient();

let params = {
  TableName: 'Admins'
}

docClient.scan(params, (err, data) => {
  //Thêm items mới với ID tăng dần
  var adminID = '';

  //Lấy ra ID items cuối cùng 
  if (err) {
    console.error('Error JSON:', JSON.stringify(err, null, 2));
  } else {
    //Tạo ra biến BusinessID mới
    var count = Number(data.Items.length);
    if (count != 0) {
      var max = 0;
      data.Items.forEach(item => {
        var index = Number(item.adminID.match(/[^_]*$/));
        if (index > max) {
          max = index;
        }
      });
      var indexN = max + 1;
      adminID = "AD_" + indexN.toString();
    } else {
      adminID = 'AD_1';
      console.log('Count: ' + count);
    }

    //Import
    let params = {
      TableName: 'Admins',
      Item: {
        adminID: "admin",
        adminName: "admin",
        address: "826 QUang Trung - Gò Vấp",
        email: "october15th98@gmail.com",
        phone: "0827374414",
        username: "admin",
        password: bcrypt.hashSync("admin"),
        category: [

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

