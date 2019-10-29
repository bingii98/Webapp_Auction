const AWS = require('aws-sdk');

AWS.config.update({
  "region": "us-east-1",
  "endpoint": "http://localhost:3000",
});

let dynamodb = new AWS.DynamoDB();

let params = {
  TableName: "Customers",
  KeySchema: [
    {AttributeName: "customerID", KeyType: "HASH"},
    {AttributeName: "customerName", KeyType: "RANGE"}
  ],
  AttributeDefinitions: [
    {AttributeName: "customerID", AttributeType: "S"},
    {AttributeName: "customerName", AttributeType: "S"}
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