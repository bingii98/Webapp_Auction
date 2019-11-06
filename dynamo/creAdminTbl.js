const AWS = require('aws-sdk');

AWS.config.update({
  "region": "us-east-1",
  "endpoint": "http://dynamodb.us-east-1.amazonaws.com"
});

let dynamodb = new AWS.DynamoDB();

let params = {
  TableName: "Admins",
  KeySchema: [
    {AttributeName: "adminID", KeyType: "HASH"},
    {AttributeName: "adminName", KeyType: "RANGE"}
  ],
  AttributeDefinitions: [
    {AttributeName: "adminID", AttributeType: "S"},
    {AttributeName: "adminName", AttributeType: "S"}
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10
  }
};

dynamodb.createTable(params, (err, data) => {
  if(err){
    console.error(`Something went wrong : ${JSON.stringify(err,null,2)}`);
  }else{
    console.log(`Created table ${JSON.stringify(data, null, 2)}`);
  }
});