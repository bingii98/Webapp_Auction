const AWS = require('aws-sdk');

AWS.config.update({
  region: "CNM",
  endpoint: 'http://localhost:8000',
});

const docClient = new AWS.DynamoDB.DocumentClient();

let params = {
  TableName: 'Businesss'
}

docClient.scan(params, (err, data) => {
  //Thêm items mới với ID tăng dần
  var businessID = '';

  //Lấy ra ID items cuối cùng 
  if (err) {
    console.error('Error JSON:', JSON.stringify(err, null, 2));
  } else {
    //Tạo ra biến BusinessID mới
    var count = Number(data.Items.length);
    if (count != 0) {
      var max = 0;
      data.Items.forEach(item => {
        var index = Number(item.businessID.match(/[^_]*$/));
        if (index > max) {
          max = index;
        }
      });
      var indexN = max + 1;
      businessID = "BSN_" + indexN.toString();
    } else {
      businessID = 'BSN_1';
      console.log('Count: ' + count);
    }

    //Import
    let params = {
      TableName: 'Businesss',
      Item: {
        businessID: businessID,
        businessName: "ABC Cake",
        isStatus: true,
        address: "826 QUang Trung - Gò Vấp",
        email: "october15th98@gmail.com",
        phone: "0827374414",
        username: "bingii98",
        password: "123",
        category: [
          {
            catID: "CR_1",
            categoryName: "Đồ điện tử",
            product: [
              {
                productID: "PR_1",
                productName: "Aphone 10 XMas",
                productDescribe: "Cụm camera trân châu đường đen.",
                productImage: "https://cdn.tgdd.vn/Files/2019/09/12/1197622/f4_800x600.jpg",
                auction: {
                  auctionID: "AC_1",
                  auctionName: "Iphone 11 đầu tiên",
                  startDate: Date(),
                  timeRun: 12000,
                  startPrice: 10000,
                  isRunning: true,
                }
              }
            ],
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

