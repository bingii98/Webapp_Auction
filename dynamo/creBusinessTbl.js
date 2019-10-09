const AWS = require('aws-sdk');

AWS.config.update({
  region: "CNM",
  endpoint: "http://localhost:8000"
});

let dynamodb = new AWS.DynamoDB();

let params = {
  TableName: "Business",
  KeySchema: [
    {AttributeName: "businessName", KeyType: "HASH"},
    {AttributeName: "businessID", KeyType: "SORT"},
  ],
  AttributeDefinitions: [
    {AttributeName: "businessName", AttributeType: "S"},
    {AttributeName: "businessID", AttributeType: "S"}
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