const AWS = require('aws-sdk');

AWS.config.update({
  region: "CNM",
  endpoint: "http://localhost:8000"
});

let docClient = new AWS.DynamoDB.DocumentClient();

function getAllItem(res) {
  let params = {
    TableName: "Business"
  };
  let scanObject = {};
  docClient.scan(params, (err, data) => {
    if (err) {
      scanObject.err = err;
    } else {
      scanObject.data = data;
    }
  });
  res.render({obj : scanObject});
}


module.exports = {
  getAllItem : getAllItem,
};